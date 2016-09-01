
var sumBy = require('lodash/sumBy')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var validate = require('../../../validate')
var Err = require('../../../../Err')

var moment = require('moment')

module.exports = function Brokerage (db, investor, portfolio)
{
	var brokerage = {}

	var knex = db.knex
	var one  = db.helpers.one
	var oneMaybe  = db.helpers.oneMaybe

	var table = knexed(knex, 'brokerage')

	var raw = knex.raw


	// byId
	brokerage.byId = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return knex(raw('brokerage AS B'))
			.transacting(trx)
			.select('cash', 'multiplier')
			.where('investor_id', investor_id)
			.where('timestamp',
				table().max('timestamp')
				.where('investor_id', raw('B.investor_id'))
				.where(function ()
				{
					if (for_date)
					{
						this.where('timestamp', '<=', for_date)
					}
				})
			)
		})
		.then(r =>
		{
			/* brokerage.init guarantees
			   brokerage existence for dates
			   from Investor Onboarding */
			if (! r.length)
			{
				throw BrokerageDoesNotExist({ for_date: for_date })
			}

			return r
		})
		.then(one)
		.then(it =>
		{
			it.cash = Number(it.cash)

			return it
		})
	})

	var BrokerageDoesNotExist = Err('brokerage_not_exist_for_date',
		 'Brokerage does not exist for this time point')

	brokerage.cashById = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return brokerage.byId(trx, investor_id, for_date)
		.then(it => it.cash)
	})

	brokerage.isDateAvail =
		knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return table(trx)
			.where('investor_id', investor_id)
			.andWhere('timestamp', '>', for_date)
		})
		.then(res =>
		{
			return ! res.length
		})
	})

	brokerage.isExist = knexed.transact(knex, (trx, investor_id) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return table(trx)
			.where('investor_id', investor_id)
		})
		.then(res => res.length)
	})


	// grid
	var groupBy = require('lodash/groupBy')
	var orderBy = require('lodash/orderBy')
	var toPairs = require('lodash/toPairs')

	var first = require('lodash/head')
	var last  = require('lodash/last')

	brokerage.grid = knexed.transact(knex, (trx, investor_id) =>
	{
		return table(trx)
		.select(
			'timestamp',
			raw(`date_trunc('day', timestamp) + INTERVAL '1 day' as day`),
			'cash',
			'multiplier'
		)
		.where('investor_id', investor_id)
		.orderBy('timestamp')
		.then(datadays =>
		{
			var grid = {}

			datadays = groupBy(datadays, it => it.day.toISOString())
			datadays = toPairs(datadays)
			datadays = orderBy(datadays, '0')

			datadays = datadays.map(pair =>
			{
				var day = pair[1]

				day = last(day)

				day =
				{
					cash: Number(day.cash),
					multiplier: day.multiplier
				}

				return [ pair[0], day ]
			})

			/* expect Brokerage datadays to be not empty.
			   This means that if Investor is Onboarded
			   there's always at least one entry in Brokerage.
			 */
			expect(datadays).not.empty

			grid.daterange =
			[
				first(datadays)[0],
				 last(datadays)[0]
			]

			grid.datadays = datadays

			return grid
		})
	})


	// init
	var index_amount_cap = 1e5

	var NotActualBrokerage = Err('not_actual_brokerage',
		'More actual brokerage already exists')

	brokerage.initOrSet = knexed.transact(knex,
	(trx, investor_id, amount, timestamp) =>
	{
		var init_brokerage = () =>
		{
			amount = amount || index_amount_cap

			var multiplier = index_amount_cap / amount

			return table(trx)
			.insert(
			{
				investor_id: investor_id,
				cash: amount,
				timestamp: timestamp,
				multiplier: multiplier
			})
		}

		var exact_date = () =>
		{
			return table(trx)
			.where('investor_id', investor_id)
			.where('timestamp', timestamp)
			.then(oneMaybe)
			.then(Boolean)
		}

		return Promise.all(
		[
			brokerage.isExist(trx, investor_id),
			exact_date(),
			brokerage.isDateAvail(trx, investor_id, timestamp)
		])
		.then(so =>
		{
			var is_exist = so[0]
			var is_exact = so[1]
			var is_avail = so[2]

			if (! is_exist)
			{
				return init_brokerage()
			}

			if (! is_avail)
			{
				throw NotActualBrokerage()
			}

			if (! is_exact && is_avail)
			{
				return brokerage.set(trx, investor_id, amount, timestamp)
			}
			else if (is_exact && is_avail)
			{
				return portfolio.holdings.byId(trx, investor_id)
				.then(holdings =>
				{
					var real_allocation
						= amount
						+ sumBy(holdings, h => h.amount * h.price)

					var multiplier = (index_amount_cap / real_allocation)

					return table(trx)
					.where(
					{
						investor_id: investor_id,
						timestamp: timestamp
					})
					.update(
					{
						cash: amount,
						multiplier: multiplier
					})
				})
			}
		})
	})


	// set
	brokerage.set = knexed.transact(knex, (trx, investor_id, cash, timestamp) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			/* validate update keys */
			validate.required(cash, 'cash')
			validate.number(cash, 'cash')

			if (cash < 0)
			{
				throw InvalidAmount({ field: 'cash' })
			}

			validate.required(timestamp, 'timestamp')
			validate.date(timestamp, 'timestamp')

			return put(trx, investor_id, cash, timestamp)
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')


	function put (trx, investor_id, new_cash, timestamp)
	{
		expect(new_cash).a('number')

		return Promise.all(
		[
			brokerage.byId(trx, investor_id),
			portfolio.holdings.byId(trx, investor_id)
		])
		.then(values =>
		{
			var cash = values[0].cash
			var multiplier = values[0].multiplier

			var holdings  = values[1]

			var real_allocation
			 = new_cash
			 + sumBy(holdings, h => h.amount * h.price)

			var new_multiplier = (index_amount_cap / real_allocation)

			if ((cash === new_cash) && (multiplier === new_multiplier))
			{
				console.warn('CASH recalculate to the same values')
				return
			}

			var batch =
			{
				investor_id: investor_id,

				cash: new_cash,
				multiplier: new_multiplier
			}

			if (timestamp)
			{
				batch.timestamp = timestamp
			}

			return table(trx).insert(batch)
			.catch(Err.fromDb(
				'timed_brokerage_point_unique',
				DuplicateBrokerageEntry
			))
		})
	}

	var DuplicateBrokerageEntry = Err('brokerage_duplicate',
		'There can be only one Brokerage entry per timestamp for Investor')


	brokerage.recalculate = knexed.transact(knex, (trx, investor_id) =>
	{
		return brokerage.cashById(trx, investor_id)
		.then(cash =>
		{
			// cash -> new_cash,
			// recalculate because of holdings changed

			return put(trx, investor_id, cash)
		})
	})


	brokerage.update = knexed.transact(knex, (trx, investor_id, date, data) =>
	{
		/* operation with validation procedure:
		 * data =
		 * {
		 *   operation: 'deposit' | 'withdraw' | 'fee' | 'interest' | 'trade'
		 *   amount: number
		 * }
		 * */
		var operation = data.operation
		var amount = data.amount

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return brokerage.byId(trx, investor_id, date)
		})
		.then(brokerage =>
		{
			if (operation in valid_operations)
			{
				valid_operations[operation](amount, brokerage)
			}
			else
			{
				throw InvalidOperation()
			}

			var cash = amount + brokerage.cash

			return put(trx, investor_id, cash, date)
		})
	})

	var valid_operations =
	{
		deposit: validate_positive,
		withdraw: validate_negative,
		interest: validate_positive,
		fee: validate_negative,
		trade: validate_deal
	}

	function validate_deal (amount, brokerage)
	{
		/* Validations:
		 * deposit: is number, amount > 0
		 * withdraw: is number, 0 < amount <= brokerage
		 * transactional fee: is number, 0 < amount <= brokerage
		 * interest: is number, amount > 0
		 * trade:
		 * - is number
		 * - buy: amount < 0, abs(amount) <= brokerage
		 * - sold: amount > 0
		 * */

		validate.required(amount, 'amount')
		validate.number(amount, 'amount')
		if (amount === 0)
		{
			throw InvalidAmount()
		}
		if (amount + brokerage.cash < 0)
		{
			throw InvalidAmount(
			{
				data: 'Brokerage may not become less than zero'
			})
		}
	}

	function validate_positive (amount, brokerage)
	{
		validate_deal(amount, brokerage)
		if (amount < 0)
		{
			throw InvalidAmount(
			{
				data: 'Amount should be positive for this operation'
			})
		}
	}

	function validate_negative (amount, brokerage)
	{
		validate_deal(amount, brokerage)
		if (amount > 0)
		{
			throw InvalidAmount(
			{
				data: 'Amount should be negative for this operation'
			})
		}
	}

	var InvalidOperation = Err('invalid_portfolio_operation',
		'Invalid Portfolio Operation')

	return brokerage
}

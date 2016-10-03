
var extend = require('lodash/extend')
var sumBy = require('lodash/sumBy')
var pick = require('lodash/pick')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var validate = require('../../../validate')
var Err = require('../../../../Err')

var moment = require('moment')

module.exports = function Brokerage (db, investor, portfolio)
{
	var brokerage = {}

	var knex = db.knex
	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	var table = knexed(knex, 'brokerage')

	var raw = knex.raw


	// byId
	brokerage.byId = knexed.transact(knex,
		(trx, investor_id, for_date, options) =>
	{
		options = extend(
		{
			future: false,
			soft:   false
		}
		, options)

		var query = knex(raw('brokerage AS B'))
		.transacting(trx)
		.select('cash', 'multiplier')
		.where('investor_id', investor_id)

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return query.clone()
			.where('timestamp',
				table(trx).max('timestamp')
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
				if (for_date && options.future)
				{
					return query.clone()
					.where('timestamp',
						table(trx).min('timestamp')
						.where('investor_id', raw('B.investor_id'))
						.where('timestamp', '>', for_date)
					)
				}
			}

			return r
		})
		.then(r =>
		{
			var exists = !! r.length
			if (exists)
			{
				return r[0]
			}
			else
			{
				if (options.soft)
				{
					/* dummy */
					return {
						cash: index_amount_cap,
						multiplier: 1
					}
				}
				else
				{
					throw BrokerageDoesNotExist({ for_date: for_date })
				}
			}
		})
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

	brokerage.availableDate = knexed.transact(knex, (trx, investor_id) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return table(trx)
			.where('investor_id', investor_id)
			.select(raw('MAX(timestamp) AS available_from'))
		})
		.then(one)
	})


	brokerage.isExact = knexed.transact(knex, (trx, investor_id, timestamp) =>
	{
		return table(trx)
		.where('investor_id', investor_id)
		.where('timestamp', timestamp)
		.then(oneMaybe)
		.then(Boolean)
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

	brokerage.ensure = knexed.transact(knex, (trx, investor_id) =>
	{
		return brokerage.isExist(trx, investor_id)
		.then(Err.falsy(BrokerageDoesNotExist))
	})


	// grid
	var groupBy = require('lodash/groupBy')
	var orderBy = require('lodash/orderBy')
	var toPairs = require('lodash/toPairs')

	var first = require('lodash/head')
	var last  = require('lodash/last')

	brokerage.grid = knexed.transact(knex, (trx, investor_id, resolution) =>
	{
		resolution || (resolution = 'day')

		return brokerage.ensure(trx, investor_id)
		.then(() =>
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
		})
		.then(datadays =>
		{
			var grid = {}

			if (resolution === 'day')
			{
				datadays = groupBy(datadays, it => it.day.toISOString())
			}
			else
			{
				datadays = groupBy(datadays, it => it.timestamp.toISOString())
			}
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
		'More actual brokerage already exist')

	brokerage.set = knexed.transact(knex,
		(trx, investor_id, cash, timestamp) =>
	{
		var init_brokerage = () =>
		{
			cash = cash || index_amount_cap
			timestamp = moment.utc(timestamp).format()

			var multiplier = index_amount_cap / cash

			return table(trx)
			.insert(
			{
				investor_id: investor_id,
				cash: cash,
				timestamp: timestamp,
				multiplier: multiplier
			})
		}

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			validate.required(cash, 'cash')
			validate.number(cash, 'cash')

			if (cash < 0)
			{
				throw InvalidAmount({ field: 'cash' })
			}

			validate.required(timestamp, 'timestamp')
			validate.date(timestamp, 'timestamp')
		})
		.then(() => brokerage.isExist(trx, investor_id))
		.then(is_exist =>
		{
			if (! is_exist)
			{
				return init_brokerage()
			}
			else
			{
				return put(
					trx,               // transaction
					investor_id,       // investor_id
					cash,              // new cash to set
					timestamp,         // timestamp
					null,              // holdings are the same
					{ override: true } // override on exact match
				)
			}
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')


	// eslint-disable-next-line max-params
	function put (trx, investor_id, new_cash, timestamp, old_holdings, options)
	{
		expect(new_cash).a('number')

		if (old_holdings !== null)
		{
			expect(old_holdings).an('array')
		}

		options || (options = {})

		timestamp = moment(timestamp || undefined).startOf('second')

		return brokerage.isDateAvail(trx, investor_id, timestamp)
		.then((is_avail) =>
		{
			if (! is_avail)
			{
				throw NotActualBrokerage()
			}

			return Promise.all(
			[
				brokerage.byId(trx, investor_id, timestamp),
				portfolio.holdings.byId
					.quotes(trx, investor_id, timestamp, { other: true }),
				brokerage.isExact(trx, investor_id, timestamp)
			])
		})
		.then(values =>
		{
			var cash       = values[0].cash
			var multiplier = values[0].multiplier

			var current_holdings = values[1]

			var is_exact = values[2]

			if (old_holdings === null)
			{
				old_holdings = current_holdings
			}

			if (options.recalculate)
			{
				var previous_allocation
				 = cash + sumBy(old_holdings, 'real_allocation')
				previous_allocation *= multiplier

				var current_allocation
				 = new_cash + sumBy(current_holdings, 'real_allocation')

				multiplier = (previous_allocation / current_allocation)
			}

			var batch =
			{
				investor_id: investor_id,

				cash: new_cash,
				multiplier: multiplier
			}

			if (timestamp)
			{
				batch.timestamp = timestamp
			}

			if (options.override && is_exact)
			{
				return table(trx)
				.where('investor_id', investor_id)
				.where('timestamp', timestamp)
				.update(pick(batch, 'cash', 'multiplier'))
			}
			else
			{
				return table(trx).insert(batch)
				.catch(Err.fromDb(
					'timed_brokerage_point_unique',
					DuplicateBrokerageEntry
				))
			}
		})
	}

	var DuplicateBrokerageEntry = Err('brokerage_duplicate',
		'There can be only one Brokerage entry per timestamp for Investor')


	brokerage.recalculate = knexed.transact(knex,
		(trx, investor_id, timestamp, old_holdings) =>
	{
		if (old_holdings !== null)
		{
			expect(old_holdings).an('array')
		}

		return brokerage.cashById(trx, investor_id, timestamp)
		.then(cash =>
		{
			// cash -> new_cash,
			// recalculate because of holdings changed

			return put(
				trx,
				investor_id,
				cash,
				timestamp,
				old_holdings,
				{
					override: true,
					recalculate: true
				}
			)
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
			var options = {}
			if (operation === 'deposit' || operation === 'withdraw')
			{
				options.recalculate = true
			}

			if (operation in valid_operations)
			{
				valid_operations[operation](amount, brokerage)
			}
			else
			{
				throw InvalidOperation()
			}

			var cash = amount + brokerage.cash

			return put(
				trx,               // transaction
				investor_id,       // investor_id
				cash,              // new cash to set
				date,              // timestamp
				null,              // holdings are the same
				{ override: true } // override on exact match
			)
		})
	})

	brokerage.removeState = knexed.transact(knex, (trx, investor_id, date) =>
	{
		date = moment(date).startOf('second')

		return table(trx)
		.where({
			investor_id: investor_id,
			timestamp: date
		})
		.del()
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
			// TODO: allow operations with 0 amount (buy price is 0)
			console.warn('Brokerage will not change due to 0 of amount')
			// throw InvalidAmount()
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

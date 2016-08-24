
var sumBy = require('lodash/sumBy')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var validate = require('../../../validate')
var Err = require('../../../../Err')

module.exports = function Brokerage (db, investor, portfolio)
{
	var brokerage = {}

	var knex = db.knex
	var one  = db.helpers.one

	var table = knexed(knex, 'brokerage')


	// byId
	brokerage.byId = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		var raw = knex.raw

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
		.debug()
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

	// brokerage.byId(120, new Date('2016-08-23 08:59:58.34+00'))
	// brokerage.byId(120, new Date('2016-08-23 08:59:59.34+00'))
	brokerage.byId(120)
	// brokerage.cashById(120)
	.then(console.info, console.error)


	// init
	var index_amount_cap = 1e5

	brokerage.init = (trx, investor_id) =>
	{
		return table(trx)
		.insert(
		{
			investor_id: investor_id,
			cash: index_amount_cap,
			multiplier: 1.0
		})
	}


	// set
	brokerage.set = knexed.transact(knex, (trx, investor_id, cash) =>
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

			return put(trx, investor_id, cash)
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
		})
	}


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
		var for_date = date

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return brokerage.byId(trx, investor_id, for_date)
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

			return put(trx, investor_id, cash)
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

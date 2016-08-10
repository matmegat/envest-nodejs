
var knexed = require('../../../knexed')

var _ = require('lodash')

var validate = require('../../../validate')
var Err = require('../../../../Err')

module.exports = function Brokerage (db, investor)
{
	var brokerage = {}

	var knex = db.knex
	var one  = db.helpers.one

	brokerage.table = knexed(knex, 'brokerage')

	function set_brokerage (trx, investor_id, data)
	{
		var where_clause  = { investor_id: investor_id }
		var update_clause = _.pick(data, 'cash_value', 'multiplier')

		return brokerage.table(trx)
		.where(where_clause)
		.update(update_clause)
	}

	brokerage.byInvestorId = knexed.transact(knex, (trx, investor_id) =>
	{
		return brokerage.table(trx)
		.select('cash_value', 'multiplier')
		.where('investor_id', investor_id)
		.then(one)
		.then(r =>
		{
			r.cash_value = Number(r.cash_value)

			return r
		})
	})

	brokerage.set = knexed.transact(knex, (trx, investor_id, data) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			/* validate update keys */
			validate.required(data.cash_value, 'cash_value')
			validate.number(data.cash_value, 'cash_value')
			if (data.cash_value < 0)
			{
				throw InvalidAmount({ field: 'cash_value' })
			}

			if ('multiplier' in data)
			{
				validate_multiplier(data.multiplier)
			}

			return set_brokerage(trx, investor_id, data)
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')

	// eslint-disable-next-line id-length
	function validate_multiplier (value)
	{
		validate.number(value, 'multiplier')
		if (value <= 0)
		{
			throw InvalidAmount({ field: 'multiplier' })
		}
	}


	brokerage.update = knexed.transact(knex, (trx, investor_id, data) =>
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
			return brokerage.table(trx)
			.where('investor_id', investor_id)
			.then(one)
		})
		.then((brokerage) =>
		{
			if (operation in valid_operations)
			{
				valid_operations[operation](amount, brokerage)
			}
			else
			{
				throw InvalidOperation()
			}

			data.cash_value = amount + Number(brokerage.cash_value)
			return set_brokerage(trx, investor_id, data)
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
		if (amount + Number(brokerage.cash_value) < 0)
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

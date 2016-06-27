var knexed = require('../../../knexed')

var _ = require('lodash')

var validate = require('../../../validate')
var Err = require('../../../../Err')

module.exports = function Brokerage (db, investor)
{
	var brokerage = {}

	var knex    = db.knex
	var helpers = db.helpers

	brokerage.brokerage_table = knexed(knex, 'brokerage')
	brokerage.holdings_table = knexed(knex, 'portfolio_symbols')

	function set_brokerage (trx, data)
	{
		var where_clause = _.pick(data, ['investor_id'])
		var update_clause = _.pick(data, ['cash_value', 'multiplier'])

		return brokerage.brokerage_table(trx)
		.where(where_clause)
		.update(update_clause)
	}

	brokerage.set = knexed.transact(knex, (trx, data) =>
	{
		return investor.all.ensure(data.investor_id, trx)
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

			return set_brokerage(trx, data)
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


	brokerage.update = knexed.transact(knex, (trx, data) =>
	{
		/* operation with validation procedure:
		 * data =
		 * {
		 *   operation: 'deposit' | 'withdraw' | 'fee' | 'interest' | 'trade'
		 *   investor_id: integer,
		 *   amount: number
		 * }
		 * */
		var operation = data.operation
		var amount = data.amount

		return investor.all.ensure(data.investor_id, trx)
		.then(() =>
		{
			return brokerage.brokerage_table(trx)
			.where('investor_id', data.investor_id)
			.then(helpers.one)
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

			data.cash_value = amount + brokerage.cash_value
			return set_brokerage(trx, data)
		})
		.then(() =>
		{
			if (operation in multiplier_update)
			{
				return multiplier_update[operation](trx, data.investor_id)
			}
			else
			{
				return false
			}
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

	var multiplier_update =
	{
		deposit: calc_multiplier,
		withdraw: calc_multiplier
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
		if (amount + brokerage.cash_value < 0)
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


	function calc_multiplier (trx, investor_id)
	{
		return brokerage.brokerage_table(trx)
		.where('investor_id', investor_id)
		.then(helpers.one)
		.then((brokerage) =>
		{
			return brokerage.holdings_table(trx)
			.where('investor_id', investor_id)
			.then((holdings) =>
			{
				return {
					brokerage: brokerage,
					holdings: holdings
				}
			})
		})
		.then((full_portfolio) =>
		{
			var indexed_amount = 100000
			var real_allocation = full_portfolio.brokerage.cash_value

			full_portfolio.holdings.forEach((holding) =>
			{

				real_allocation += holding.amount * holding.buy_price
			})

			var multiplier = indexed_amount / real_allocation

			return set_brokerage(
			trx,
			{
				investor_id: investor_id,
				multiplier: multiplier
			})
		})
	}

	return brokerage
}

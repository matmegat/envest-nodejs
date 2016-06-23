
var expect = require('chai').expect

var _ = require('lodash')

var knexed = require('../knexed')

var Err = require('../../Err')

var validate = require('../validate')

module.exports = function Portfolio (db)
{
	var portfolio = {}

	var knex    = db.knex
	var helpers = db.helpers

	portfolio.table = knexed(knex, 'portfolio_symbols')
	portfolio.brokerage_table = knexed(knex, 'brokerage')

	expect(db, 'Portfolio depends on Investor').property('investor')
	var investor = db.investor

	portfolio.list = function (options, trx)
	{
		return db.investor.public.ensure(options.investor_id, trx)
		.then(() =>
		{
			return portfolio.table(trx)
			.select(
			[
				'amount',
				'symbols.id',
				'symbols.ticker',
				'symbols.company',
				'brokerage.multiplier'
			])
			.where('portfolio_symbols.investor_id', options.investor_id)
			.innerJoin('symbols', 'portfolio_symbols.symbol_id', 'symbols.id')
			.innerJoin(
				'brokerage',
				'portfolio_symbols.investor_id',
				'brokerage.investor_id'
			)
		})
		.then((portfolio_holdings) =>
		{
			portfolio_holdings = portfolio_holdings.map((portfolio_holding) =>
			{
				var random_price = _.random(50.0, 150.0, true)
				portfolio_holding.allocation =
					portfolio_holding.amount *
					random_price *
					portfolio_holding.multiplier

				portfolio_holding.gain = _.random(-10.0, 10.0, true)
				portfolio_holding.symbol = _.pick(portfolio_holding,
				[
					'id',
					'ticker',
					'company'
				])

				return _.pick(portfolio_holding,
				[
					'symbol',
					'allocation',
					'gain'
				])
			})

			return {
				total: portfolio_holdings.length,
				holdings: _.orderBy(portfolio_holdings, 'allocation', 'desc')
			}
		})
	}

	var brokerage = {}
	portfolio.brokerage = brokerage

	function set_brokerage (trx, data)
	{
		var where_clause = _.pick(data, ['investor_id'])
		var update_clause = _.pick(data, ['cash_value', 'multiplier'])

		return portfolio.brokerage_table(trx)
		.where(where_clause)
		.update(update_clause)
		.debug(true)
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

	// eslint-disable-next-line id-length
	function validate_multiplier (value)
	{
		value.number(value, 'multiplier')
		if (value <= 0)
		{
			throw InvalidAmount({ field: 'multiplier' })
		}
	}

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')


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
			return portfolio.brokerage_table(trx)
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
		return portfolio.brokerage_table(trx)
		.where('investor_id', investor_id)
		.then(helpers.one)
		.then((brokerage) =>
		{
			return portfolio.table(trx)
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
				var symbol_allocation =
					holding.amount *
					(holding.buy_price || _.random(10.0, 100.0, true))
					/* TODO: migrate to buy_price */

				real_allocation += symbol_allocation
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

	return portfolio
}

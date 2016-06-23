
var expect = require('chai').expect

var _ = require('lodash')

var knexed = require('../knexed')

var Err = require('../../Err')
var WrongBrokerageId = Err('wrong_brokerage_id', 'Wrong Brokerage Id')
var BrokerageNotFound = Err('brokerage_not_found', 'Wrong Brokerage Id')

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
	}

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')

	brokerage.update = knexed.transact(knex, (trx, data) =>
	{
		/* operation with validation procedure:
		* - deposit
		* - withdraw
		* - transactional fee
		* - interest
		* - trade
		*
		* data =
		* {
		*   operation: 'deposit' | 'withdraw' | 'fee' | 'interest' | 'trade'
		*   investor_id: integer,
		*   amount: number
		* }
		* */
		var valid_operations =
		[
			'deposit',
			'withdraw',
			'fee',
			'interest',
			'trade',
		]

		return investor.all.ensure(data.investor_id, trx)
		.then(() =>
		{
			return brokerage.ensure(data.investor_id, trx)
		})
		.then(() =>
		{
			return portfolio.brokerage_table(trx)
			.where('investor_id', data.investor_id)
			.then(helpers.one)
		})
		.then((brokerage) =>
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

			validate.required(data.operation, 'operation')
			validate.required(data.amount, 'amount')

			validate.string(data.operation, 'operation')
			validate.number(data.amount, 'amount')

			if (valid_operations.indexOf(data.operation) === -1)
			{
				throw InvalidOperation()
			}
			if (data.amount === 0)
			{
				throw InvalidAmount()
			}

			if (brokerage.cash_value + data.amount < 0)
			{
				throw InvalidAmount(
				{
					data: 'Brokerage may not become less than zero'
				})
			}

			data.cash_value = brokerage.cash_value + data.amount
			return set_brokerage(trx, data)
		})
		.then(() =>
		{
			if (data.operation === 'deposit' || data.operation === 'withdraw')
			{
				/* TODO: call update multiplier */
				return true
			}
			else
			{
				return false
			}
		})
	})

	var InvalidOperation = Err('invalid_portfolio_operation',
		'Invalid Portfolio Operation')


	return portfolio
}

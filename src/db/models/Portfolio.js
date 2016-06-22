
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

	brokerage.is = function (investor_id, trx)
	{
		return validate_id(investor_id)
		.then(() =>
		{
			return portfolio.brokerage_table(trx)
			.where('investor_id', investor_id)
			.then(helpers.oneMaybe)
			.then(Boolean)
		})
	}

	var validate_id = require('../../id')
	.validate.promise(WrongBrokerageId)

	brokerage.ensure = function (investor_id, trx)
	{
		return brokerage.is(investor_id, trx)
		.then(Err.falsy(BrokerageNotFound))
	}

	brokerage.set = knexed.transact(knex, (trx, data) =>
	{
		return investor.all.ensure(data.investor_id, trx)
		.then(() =>
		{
			return brokerage.is(data.investor_id, trx)
			.then((is_brokerage) =>
			{
				var queryset = portfolio.brokerage_table(trx)

				if (is_brokerage)
				{
					queryset.where('investor_id', data.investor_id)
					.update({ cash_value: data.brokerage })
				}
				else
				{
					queryset.insert(
					{
						investor_id: data.investor_id,
						cash_value: data.brokerage,
						multiplier: 1.0
					})
				}

				return queryset
			})
		})
	})

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

			return brokerage
		})
	})

	var InvalidOperation = Err('invalid_portfolio_operation',
		'Invalid Portfolio Operation')
	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')


	return portfolio
}

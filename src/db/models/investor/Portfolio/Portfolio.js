var knexed = require('../../../knexed')

var _ = require('lodash')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var knex    = db.knex
	// var helpers = db.helpers

	portfolio.table = knexed(knex, 'portfolio_symbols')
	portfolio.brokerage = Brokerage(db, investor)
	portfolio.holdings  = Holdings(db, investor)

	portfolio.list = function (options, trx)
	{
		return investor.public.ensure(options.investor_id, trx)
		.then(() =>
		{
			return portfolio.table(trx)
			.select(
			[
				'symbol_exchange',
				'symbol_ticker',
				'buy_price',
				'amount',
				'brokerage.multiplier'
			])
			.where('portfolio_symbols.investor_id', options.investor_id)
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
				portfolio_holding.allocation =
					portfolio_holding.amount *
					portfolio_holding.buy_price *
					portfolio_holding.multiplier

				portfolio_holding.gain = _.random(-10.0, 10.0, true)
				// TODO: request to XIgnite
				portfolio_holding.symbol =
				{
					exchange: portfolio_holding.symbol_exchange,
					ticker: portfolio_holding.symbol_ticker,
					company: 'TODO: request XIgnite'
				}

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

	portfolio.recalculate = function (investor_id)
	{
		return portfolio.brokerage.byInvestorId(investor_id)
		.then((brokerage) =>
		{
			return portfolio.holdings.byInvestorId(investor_id)
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
			var real_allocation = +full_portfolio.brokerage.cash_value

			full_portfolio.holdings.forEach((holding) =>
			{
				real_allocation += holding.amount * holding.buy_price
			})

			var multiplier = indexed_amount / real_allocation

			return portfolio.brokerage.set(
			{
				investor_id: investor_id,
				cash_value: +full_portfolio.brokerage.cash_value,
				multiplier: multiplier
			})
		})
	}

	portfolio.set_holdings = function (options)
	{
		return portfolio.holdings.set(options)
		.then(() =>
		{
			return portfolio.recalculate(options.investor_id)
		})
	}

	portfolio.set_brokerage = function (options)
	{
		return portfolio.brokerage.set(options)
		.then(() =>
		{
			return portfolio.recalculate(options.investor_id)
		})
	}

	return portfolio
}

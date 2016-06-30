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

	portfolio.set_holdings = knexed.transact(knex, (trx, options) =>
	{
		return portfolio.holdings.set(options)
		.then(() =>
		{
			return portfolio.brokerage.calc_multiplier(trx, options.investor_id)
		})
	})

	return portfolio
}

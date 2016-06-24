var knexed = require('../../../knexed')

var _ = require('lodash')

var Brokerage = require('./Brokerage')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}
	// var holdings  = {}

	var knex    = db.knex
	// var helpers = db.helpers

	portfolio.table = knexed(knex, 'portfolio_symbols')
	portfolio.brokerage = Brokerage(db, investor)

	portfolio.list = function (options, trx)
	{
		return investor.public.ensure(options.investor_id, trx)
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

	return portfolio
}

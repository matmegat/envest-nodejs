
var _ = require('lodash')

var knexed = require('../knexed')

module.exports = function Portfolio (db)
{
	var portfolio = {}

	var knex = db.knex

	portfolio.table = knexed(knex, 'portfolio_symbols')

	portfolio.list = function (options, trx)
	{
		return db.investor.validate_id(options.investor_id)
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
		.then((portfolio_symbols) =>
		{
			portfolio_symbols = portfolio_symbols.map((portfolio_symbol) =>
			{
				var random_price = _.random(50.0, 150.0, true)
				portfolio_symbol.allocation =
					portfolio_symbol.amount *
					random_price *
					portfolio_symbol.multiplier
				portfolio_symbol.gain = _.random(-10.0, 10.0, true)

				return _.omit(portfolio_symbol, [ 'amount', 'multiplier' ])
			})

			return {
				total: portfolio_symbols.length,
				symbols: _.orderBy(portfolio_symbols, 'allocation', 'desc')
			}
		})
	}

	return portfolio
}

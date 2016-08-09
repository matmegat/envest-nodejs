
var random = require('lodash/random')
var sample = require('lodash/sampleSize')
var times  = require('lodash/times')

var symbols = require('../_symbols')

exports.seed = function (knex)
{
	return /* do not create this one in favor of portfolio-history */

	return knex('portfolio_symbols').del()
	.then(() =>
	{
		return knex('investors')
		.select('user_id as id')
	})
	.then(investors =>
	{
		var portfolio_symbols = []
		investors.forEach(investor =>
		{
			var n = random(3, 6)
			var sampled_symbols = sample(symbols, n)

			times(n, (i) =>
			{
				var symbol = sampled_symbols[i]

				portfolio_symbols.push(
				{
					investor_id: investor.id,
					symbol_exchange: symbol.exchange,
					symbol_ticker: symbol.ticker,
					amount: random(100, 5000)
				})
			})
		})

		return knex('portfolio_symbols').insert(portfolio_symbols)
	})
}

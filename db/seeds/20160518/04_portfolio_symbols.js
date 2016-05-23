var random = require('lodash/random')
var times = require('lodash/times')

exports.seed = function (knex, Promise)
{
	return knex('portfolio_symbols').del()
	.then(() =>
	{
		return knex('investors')
		.select('id')
	})
	.then((investors) =>
	{
		return knex('symbols')
		.select('id')
		.then((symbols) =>
		{
			var response_data =
			{
				investors: investors,
				symbols: symbols
			}

			return response_data
		})
	})
	.then((data) =>
	{
		var investors = data.investors
		var symbols = data.symbols

		var portfolio_symbols = []
		investors.each((investor) =>
		{
			times(random(3, 6), () =>
			{
				portfolio_symbols.push(
				{
					investor_id: investor.id,
					symbol_id: symbols[random(symbols.length - 1)],
					amount: random(100, 5000)
				})
			})
		})

		return Promise.all(portfolio_symbols)
	})
}

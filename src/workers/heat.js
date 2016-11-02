
var moment = require('moment')

module.exports = function heat (app)
{
	app.db.investor.portfolio.allSymbolsInvolved()
	.then(symbols =>
	{
		if (! symbols.length) { return }

		var symbol = symbols[0]

		console.log(symbol)

		var task = recurring(() =>
		{
			console.log(1)

			return Promise.resolve()
			//app.db.symbols.seriesForPortfolio(symbol)
		})

		task()
	})
}

function recurring (fn)
{
	options =
	{
		delay: 5 * 1000 // 60 * 15
	}

	var re = () =>
	{
		console.info('start task')
		capture(fn)
		.catch(error =>
		{
			console.error('ERROR occured during recurring task')
			console.error(error)
		})
		.then(() =>
		{
			console.info('delay %s', options.delay)
			setTimeout(re, options.delay)
		})
	}

	return re
}

function capture (fn)
{
	return new Promise(rs =>
	{
		rs(fn())
	})
}

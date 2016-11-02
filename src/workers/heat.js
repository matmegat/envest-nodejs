
var moment = require('moment')

module.exports = function heat (app)
{
	var db = app.db

	db.investor.all.ids()
	.then(ids =>
	{
		if (! ids.length) { return }

		var investor_id = ids[0]

		investor_id = 120

		console.log(investor_id)

		var task = recurring(() =>
		{
			return db.investor.portfolio.grid(investor_id)
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

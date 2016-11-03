
var B = require('bluebird')

var random = require('lodash/random')

module.exports = function (app)
{
	var db = app.db

	db.investor.all.ids()
	.then(ids =>
	{
		if (! ids.length) { return }

		ids.forEach(look_for_investor)
	})

	var heat = {}

	var look_for_investor = heat.lookForInvestor = (investor_id) =>
	{
		random_delay()
		.then(recurring(() =>
		{
			// console.warn(investor_id)
			return db.investor.portfolio.grid(investor_id)
		}))
	}

	return heat
}

function recurring (fn)
{
	var options =
	{
		delay: 60 * 15 * 1000
	}

	var re = () =>
	{
		// console.info('start task')

		B.try(fn)
		.catch(error =>
		{
			console.error('ERROR occured during recurring task')
			console.error(error)
		})
		/*.then(() =>
		{
			console.info('delay %s', options.delay)
		})*/
		.delay(options.delay)
		.then(re)
	}

	return re
}

function random_delay ()
{
	return B.delay(random(0, 15) * 60 * 1000)
	.then(s => s * 1000)
}


var Router = require('express').Router
// var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = () =>
{
	var wl = {}

	wl.express = Router()

	wl.express.use(authRequired)

	wl.express.get('/', (rq, rs) =>
	{
		rs.status(200).send(RandomWatchlist('user'))
	})

	wl.express.get('/investor/:id', (rq, rs) =>
	{
		rs.status(200).send(RandomWatchlist('investor'))
	})

	return wl
}


var _ = require('lodash')

var random = _.random
var times = _.times

function RandomWatchlist (type)
{
	var count = random(5, 20)

	return times(count, () => RandomEntry(type))
}


var sample = _.sample
var clone = _.clone

function RandomEntry (type)
{
	var entry = sample(tickers)

	entry = clone(entry)

	entry.price = RandomEntry.price()

	switch (type)
	{
	case 'investor':
		entry.target_price = RandomEntry.price()
		break

	case 'user':
		entry.gain = RandomEntry.gain()
		break

	default:
		break
	}

	return entry
}

var tickers =
[
	{ exchange: 'NASDAQ', ticker: 'GOOG' },
	{ exchange: 'MOEX',   ticker: 'YNDX' },
	{ exchange: 'NASDAQ', ticker: 'TSLA' },
	{ exchange: 'AMEX',   ticker: 'GLD' }
]


var round = (v) => _.round(v, 2)

RandomEntry.price = () =>
{
	return round(random(100, 1000, true))
}

RandomEntry.gain = () =>
{
	return round(random(-10, 10, true))
}

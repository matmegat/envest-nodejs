
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
	var entry = {}

	entry.symbol = clone(sample(tickers))

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
	{ exchange: 'NASDAQ', ticker: 'GOOG', company: 'Alphabet Inc.' },
	{ exchange: 'MOEX',   ticker: 'YNDX', company: 'Yandex NV' },
	{ exchange: 'NASDAQ', ticker: 'TSLA', company: 'Tesla Motors Inc' },
	{ exchange: 'AMEX',   ticker: 'GLD',  company: 'SPDR Gold Trust' }
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

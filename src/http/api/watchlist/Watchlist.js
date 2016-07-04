
var Router = require('express').Router
var authRequired = require('../../auth-required')
var toss = require('../../toss')

module.exports = (watchlist, http) =>
{
	var wl = {}

	wl.express = Router()

	wl.express.use(authRequired)


	/* User */
	wl.express.get('/', (rq, rs) =>
	{
		var owner_id = rq.user.id

		toss(rs, watchlist.user.byId(owner_id))

		//rs.status(200).send(RandomWatchlist('user'))
	})

	wl.express.put('/:symbol', (rq, rs) =>
	{
		var owner_id = rq.user.id
		var symbol   = rq.params.symbol

		toss(rs, watchlist.user.add(owner_id, symbol))
	})

	wl.express.delete('/:symbol', (rq, rs) =>
	{
		var owner_id = rq.user.id
		var symbol   = rq.params.symbol

		toss(rs, watchlist.user.remove(owner_id, symbol))
	})


	/* Investor */
	wl.express.get('/investor/:id', (rq, rs) =>
	{
		rs.status(200).send(RandomWatchlist('investor'))
	})

	wl.express.put('/investor/:symbol', http.investorRequired,
	(rq, rs) =>
	{
		var owner_id = rq.user.id
		var symbol   = rq.params.symbol
		var additional = rq.body

		toss(rs, watchlist.investor.add(owner_id, symbol, additional))
	})

	wl.express.delete('/investor/:symbol', http.investorRequired,
	(rq, rs) =>
	{
		var owner_id = rq.user.id
		var symbol   = rq.params.symbol

		toss(rs, watchlist.investor.remove(owner_id, symbol))
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

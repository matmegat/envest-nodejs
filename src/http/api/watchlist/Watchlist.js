
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

		toss(rs, watchlist.user.byId.quotes(owner_id))
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
	wl.express.get('/investor/by-id/:id', (rq, rs) =>
	{
		var owner_id = rq.params.id

		toss(rs, watchlist.investor.byId.quotes(owner_id))
	})

	wl.express.get('/investor/', http.investorRequired,
	(rq, rs) =>
	{
		var owner_id = rq.user.id

		toss(rs, watchlist.investor.byId.quotes(owner_id))
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

/*
var _ = require('lodash')
var random = _.random
var round = (v) => _.round(v, 2)

var price = () =>
{
	return round(random(100, 1000, true))
}

var gain = () =>
{
	return round(random(-10, 10, true))
}
*/

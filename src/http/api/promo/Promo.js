
var pick = require('lodash/pick')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Promo (http, subscr_model)
{
	var promo = {}

	promo.model = subscr_model.promo
	promo.express = Router()

	promo.express.get('/', http.adminRequired, (rq, rs) =>
	{
		var options = {}

		options.filter = pick(rq.query,
		[
			'type'
		])

		options.sorter = pick(rq.query,
		[
			'sort'
		])

		toss(rs, promo.model.list(options))
	})

	promo.express.post('/create', http.adminRequired, (rq, rs) =>
	{
		toss(rs, promo.model.create(
		rq.body.type,
		rq.body.code,
		rq.body.end_time,
		rq.body.activations))
	})

	promo.express.post('/remove', http.adminRequired, (rq, rs) =>
	{
		toss(rs, promo.model.remove(rq.body.id))
	})

	promo.express.post('/activate', authRequired, (rq, rs) =>
	{
		toss(rs, promo.model.activate(rq.body.code, rq.user.id))
	})

	return promo
}

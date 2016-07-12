
var pick = require('lodash/pick')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Subscr (subscr_model)
{
	var subscr = {}

	subscr.model = subscr_model
	subscr.express = Router()

	subscr.express.post('/promo', authRequired, (rq, rs) =>
	{
		toss(rs, subscr.model.enterPromo(rq.body.code, rq.user.id))
	})

	subscr.express.post('/activate', (rq, rs) =>
	{
		var subscr_option = pick(rq.body,
		[
			'type',
			'user_id',
			'days',
			'token'
		])

		toss(rs, subscr.model.buyActivation(subscr_option))
	})

	return subscr
}

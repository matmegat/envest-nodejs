
var Router = require('express').Router
var toss = require('../../toss')
var pick = require('lodash/pick')

module.exports = function (db, http, admin)
{
	var ctrl = {}

	var express = ctrl.express = Router()

	var feed_model = db.feed

	express.use(http.adminRequired)

	express.post('/intro', (rq, rs) =>
	{
		var by_user_id     = rq.user.id
		var target_user_id = rq.body.target_user_id

		toss(rs, admin.intro(target_user_id, by_user_id))
	})

	express.post('/post-as', (rq, rs) =>
	{
		var feed_item = {}

		/* Ensure that target_user_id is investor */

		feed_item.investor_id = rq.body.target_user_id
		feed_item.type = rq.body.type
		feed_item.data = pick(rq.body,
			[
				'symbols',
				'title',
				'text',
				'motivations'
			])

		toss(rs, feed_model.add(feed_item))
	})

	return ctrl
}


var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')
var pick = require('lodash/pick')

module.exports = function (db)
{
	var notifications = {}

	notifications.model = db.notifications
	notifications.express = Router()
	notifications.express.use(authRequired)

	notifications.express.get('/', (rq, rs) =>
	{
		var options = pick(rq.query,
		[
			'page'
		])

		options.filter = pick(rq.query,
		[
			'type'
		])

		options.user_id    = rq.user.id
		options.user_group = rq.user.group

		toss(rs, notifications.model.list(options))
	})

	notifications.express.post('/', (rq, rs) =>
	{
		toss(rs, notifications.model.setViewed(rq.user.id, rq.body.viewed_ids))
	})

	return notifications
}

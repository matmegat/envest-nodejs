
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
			'max_id',
			'since_id',
		])

		options.user_id    = rq.user.id
		options.user_group = rq.user.group

		toss(rs, notifications.model.list(options))
	})

	notifications.express.post('/', (rq, rs) =>
	{
		toss(rs, notifications.model.setLastViewedId(rq.user.id, rq.body.viewed_id))
	})

	return notifications
}


var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function (db)
{
	var notifications = {}

	notifications.model = db.notifications
	notifications.express = Router()
	notifications.express.use(authRequired)

	notifications.express.get('/', (rq, rs) =>
	{
		toss(rs, notifications.model.list(rq.user.id, rq.user.group))
	})

	notifications.express.post('/', (rq, rs) =>
	{
		toss(rs, notifications.model.setLastViewedId(rq.user.id, rq.body.viewed_id))
	})

	return notifications
}

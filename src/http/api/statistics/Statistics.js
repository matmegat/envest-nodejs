
var Router = require('express').Router

var toss = require('../../toss')

module.exports = function Statistics (db, http)
{
	var statistics = {}

	var user = db.user

	statistics.express = Router()
	statistics.express.use(http.adminRequired)

	statistics.express.get('/subscriptions', (rq, rs) =>
	{
		toss(rs, user.countBySubscriptions())
	})

	statistics.express.get('/users-confirmed', (rq, rs) =>
	{
		toss(rs, user.countByEmailConfirms())
	})

	return statistics
}

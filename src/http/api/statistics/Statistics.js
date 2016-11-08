
var Router = require('express').Router

var toss = require('../../toss')

module.exports = function Statistics (db, http)
{
	var statistics = {}

	statistics.model = db.statistics

	statistics.express = Router()
	statistics.express.use(http.adminRequired)

	statistics.express.get('/subscriptions', (rq, rs) =>
	{
		toss(rs, statistics.model.subscriptions())
	})

	statistics.express.get('/users-confirmed', (rq, rs) =>
	{
		toss(rs, statistics.model.users_confirmed())
	})

	return statistics
}


var _ = require('lodash')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function (db)
{
	var investors = {}

	investors.model = db.investor
	investors.express = Router()
	// investors.express.use(authRequired)

	investors.express.get('/', (rq, rs) =>
	{
		toss(rs, investors.model.list({}))
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		toss(rs, investors.model.byId(rq.params.id))
	})

	return investors
}

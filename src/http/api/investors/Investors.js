
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')
var pick = require('lodash/pick')

module.exports = function (db)
{
	var investors = {}

	investors.model = db.investor
	investors.express = Router()
	investors.express.use(authRequired)

	investors.express.get('/', (rq, rs) =>
	{
		var options = pick(rq.query,
		[
			'max_id',
			'since_id'
		])
		toss(rs, investors.model.list(options))
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		toss(rs, investors.model.byId(rq.params.id))
	})

	return investors
}

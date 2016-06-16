
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')
var pick = require('lodash/pick')

module.exports = function (db, http)
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
		toss(rs, investors.model.public.list(options))
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		toss(rs, investors.model.public.byId(rq.params.id))
	})

	investors.express.get('/:id/portfolio', (rq, rs) =>
	{
		var options = { investor_id: rq.params.id }

		toss(rs, db.portfolio.list(options))
	})

	investors.express.post('/', http.adminRequired, (rq, rs) =>
	{
		toss(rs, investors.model.create(rq.body))
	})

	investors.express.post('/:id/field', http.adminRequired, (rq, rs) =>
	{
		var investor_id = rq.params.id

		var field = rq.body.field
		var value = rq.body.value

		toss(rs, investors.model.onboarding.update(investor_id, field, value))
	})

	return investors
}

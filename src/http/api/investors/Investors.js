
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

	var pic_decorator = db.pic.decorate('pic')

	investors.express.get('/', (rq, rs) =>
	{
		var hostname = rq.hostname

		var options = pick(rq.query,
		[
			'max_id',
			'since_id'
		])

		var data =
		investors.model.list(options)
		.then(investors =>
		{
			return investors.map(pic_decorator(hostname))
		})

		toss(rs, data)
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		var hostname = rq.hostname

		var data =
		investors.model.byId(rq.params.id)
		.then(pic_decorator(hostname))

		toss(rs, data)
	})

	return investors
}

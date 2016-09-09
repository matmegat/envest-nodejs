
var pick = require('lodash/pick')
var extend = require('lodash/extend')

var Router = require('express').Router

var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function (db, http)
{
	var investors = {}

	investors.model = db.investor
	investors.express = Router()

	var admin = db.admin

	// public routes
	investors.express.get('/', (rq, rs) =>
	{
		var options = {}

		options.paginator = pick(rq.query,
		[
			'max_id',
			'since_id',
			'page'
		])

		options.filter = pick(rq.query,
		[
			'symbol',
			'symbols'
		])

		if (rq.user && rq.user.admin)
		{
			extend(options.filter, pick(rq.query, 'is_public'))
		}

		toss(rs, choose_model(rq)
		.then(model =>
		{
			return model.list(options)
		}))
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		toss(rs, choose_model(rq)
		.then(model =>
		{
			return model.fullById(rq.params.id)
		}))
	})

	function choose_model (rq)
	{
		return Promise.resolve()
		.then(() =>
		{
			if (rq.isAuthenticated())
			{
				return admin.is(rq.user.id)
			}
		})
		.then(so =>
		{
			if (so)
			{
				return investors.model.all
			}
			else
			{
				return investors.model.public
			}
		})
	}


	// auth required
	investors.express.get('/:id/portfolio', authRequired, (rq, rs) =>
	{
		toss(rs, db.investor.portfolio.byId(rq.params.id))
	})

	investors.express.get('/:id/chart', authRequired, (rq, rs) =>
	{
		toss(rs, investors.model.portfolio.grid(rq.params.id))
	})

	investors.express.post('/:id/field', authRequired, (rq, rs) =>
	{
		var whom_id = rq.user.id
		var investor_id = rq.params.id

		var field = rq.body.field
		var value = rq.body.value

		toss(rs, investors.model.onboarding.update(
			whom_id,
			investor_id,
			field,
			value
		))
	})

	investors.express.post('/cash', authRequired, (rq, rs) =>
	{
		var investor_id = rq.user.id
		var data = pick(rq.body, 'type', 'cash', 'date')

		toss(rs, investors.model.portfolio.manageCash(investor_id, data))
	})

	// admin required
	investors.express.post('/', http.adminRequired, (rq, rs) =>
	{
		var data = extend({}, rq.body, { admin_id: rq.user.id })
		toss(rs, investors.model.create(data))
	})

	investors.express.post('/:id/go-public', http.adminRequired, (rq, rs) =>
	{
		var whom_id = rq.user.id
		var investor_id = rq.params.id

		toss(rs, investors.model.onboarding.goPublic(whom_id, investor_id))
	})

	investors.express.post('/featured', http.adminRequired, (rq, rs) =>
	{
		toss(rs, investors.model.featured.set(rq.body.investor_id))
	})

	return investors
}

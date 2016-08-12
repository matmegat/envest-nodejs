
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')
var pick = require('lodash/pick')
var extend = require('lodash/extend')

var compose = require('composable-middleware')
var AccessRequired = require('../../access-required')

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
			return model.byId(rq.params.id)
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
				console.warn('all')
				return investors.model.all
			}
			else
			{
				console.warn('public')
				return investors.model.public
			}
		})
	}


	// auth required
	investors.express.get('/:id/portfolio', authRequired, (rq, rs) =>
	{
		toss(rs, db.investor.portfolio.list(rq.params.id))
	})

	investors.express.get('/:id/chart', authRequired, (rq, rs) =>
	{
		toss(rs, investors.model.chart(rq.params.id))
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

	// admin required
	investors.express.get('/admin', http.adminRequired, (rq, rs) =>
	{
		var options = {}

		options.paginator = pick(rq.query,
		[
			'max_id',
			'since_id',
			'page'
		])

		toss(rs, investors.model.all.list(options))
	})

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


	// admin or owner required
	var accessRequired =
		compose(authRequired, AccessRequired(investors.model.all, db.admin))

	investors.express.get('/:id/admin', accessRequired, (rq, rs) =>
	{
		toss(rs, Promise.all(
		[
			investors.model.all.byId(rq.params.id),
			investors.model.portfolio.full(rq.params.id)
		])
		.then((response) => extend({}, response[0], response[1])))
	})

	return investors
}

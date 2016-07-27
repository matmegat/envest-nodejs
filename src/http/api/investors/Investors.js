
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
	investors.express.use(authRequired)

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

		toss(rs, investors.model.public.list(options))
	})

	investors.express.get('/:id', (rq, rs) =>
	{
		toss(rs, investors.model.public.byId(rq.params.id))
	})

	investors.express.get('/:id/portfolio', (rq, rs) =>
	{
		toss(rs, db.investor.portfolio.list(rq.params.id))
	})

	investors.express.get('/:id/chart', (rq, rs) =>
	{
		toss(rs, db.symbols.series('TSLA'))
	})

	investors.express.post('/:id/field', (rq, rs) =>
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

	/***************************************************************************
	* Admin Routes
	* *************************************************************************/
	var accessRequired =
		compose(authRequired, AccessRequired(investors.model.all, db.admin))

	investors.express.get('/admin', http.adminRequired, (rq, rs) =>
	{
		var options = pick(rq.query,
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

	investors.express.get('/:id/admin', accessRequired, (rq, rs) =>
	{
		return Promise.all(
		[
			investors.model.all.byId(rq.params.id),
			investors.model.portfolio.full(rq.params.id)
		])
		.then((response) => extend({}, response[0], response[1]))
		.then(toss.ok(rs))
		.catch(toss.err(rs))
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

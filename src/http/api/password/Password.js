
var Router = require('express').Router
var toss = require('../../toss')
var noop = require('lodash/noop')
var authRequired = require('../../auth-required')

var jwt_helpers = require('../../../jwt-helpers')

module.exports = function Password (user_model)
{
	var password = {}

	password.model = user_model.password
	password.express = Router()

	password.express.post('/reset', (rq, rs) =>
	{
		// toss(rs, password.model.reset(rq.body.code, rq.body.new_pass))
		password.model.reset(rq.body.code, rq.body.new_pass)
		.then((user_data) =>
		{
			rq.login(user_data, (err) =>
			{
				if (err)
				{
					return toss.err(rs, err)
				}
				else
				{
					user_data.access_token = jwt_helpers.generate(user_data)
					return toss.ok(rs, user_data)
				}
			})
		})
		.catch(toss.err(rs))
	})

	password.express.post('/req-reset', (rq, rs) =>
	{
		toss(rs, password.model.reqReset(rq.body.email))
	})

	password.express.post('/change', authRequired, (rq, rs) =>
	{
		toss(rs,
		password.model.change(rq.user.id, rq.body.pass, rq.body.new_pass)
		.then(noop))
	})

	return password
}

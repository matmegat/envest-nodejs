
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Password (user_model)
{
	var password = {}

	password.model = user_model.password
	password.express = Router()

	password.express.post('/reset', (rq, rs) =>
	{
		toss(rs, password.model.reset(rq.body.code, rq.body.new_pass))
	})

	password.express.post('/req-reset', (rq, rs) =>
	{
		toss(rs, password.model.reqReset(rq.body.email))
	})

	password.express.post('/change', authRequired, (rq, rs) =>
	{
		toss(rs, password.model.change(rq.user.id, rq.body.pass, rq.body.new_pass))
	})

	return password
}

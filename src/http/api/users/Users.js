
var Router = require('express').Router

var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Users (user_model)
{
	var users = {}

	users.express = Router()
	users.express.use(authRequired)
	users.model = user_model

	users.express.get('/:id', (rq, rs) =>
	{
		toss(rs, users.model.infoById(rq.params.id))
	})

	return users
}

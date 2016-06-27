
var Router = require('express').Router

var authRequired = require('../../auth-required')

module.exports = function Users (user_model)
{
	var users = {}

	users.express = Router()
	users.express.use(authRequired)
	users.model = user_model

	users.express.get('/current', (rq, rs) =>
	{
		rs.send(rq.user)
	})

	return users
}

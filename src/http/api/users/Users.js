
var _ = require('lodash')

var Router = require('express').Router
var toss   = require('../../toss')

var authRequired = require('../../auth-required')

module.exports = function Users (http, user_model)
{
	var users = {}

	users.express = Router()
	users.express.use(authRequired)
	users.express.use(['/', '/admins'], http.adminRequired)
	users.model = user_model

	users.express.get('/current', (rq, rs) =>
	{
		rs.send(rq.user)
	})

	users.express.get('/',  by_group('users'))
	users.express.get('/admins', by_group('admins'))

	function by_group (group)
	{
		return function (rq, rs)
		{
			var options = {}

			options.paginator = _.pick(rq.query,
			[
				'page'
			])

			options.filter = _.pick(rq.query,
			[
				'query'
			])

			options.sorter = _.pick(rq.query,
			[
				'sort',
				'dir'
			])

			toss(rs, users.model.byGroup(group, options))
		}
	}

	return users
}

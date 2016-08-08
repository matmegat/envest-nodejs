
var _ = require('lodash')

var Router = require('express').Router
var toss   = require('../../toss')

var authRequired = require('../../auth-required')

module.exports = function Users (http, user_model)
{
	var users = {}

	users.express = Router()
	users.express.use(authRequired)
	users.model = user_model

	users.express.get('/current', (rq, rs) =>
	{
		rs.send(rq.user)
	})

	users.express.get('/', http.adminRequired, by_group('users'))
	users.express.get('/admins', http.adminRequired, by_group('admins'))

	users.express.post('/change-name', (rq, rs) =>
	{
		var target_user_id = rq.user.id

		var credentials = _.pick(rq.body, 'first_name', 'last_name')

		toss(rs, users.model.changeName(target_user_id, credentials))
	})


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
				'sort'
			])

			toss(rs, users.model.byGroup(group, options))
		}
	}

	return users
}

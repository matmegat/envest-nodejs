
var Router = require('express').Router
var toss = require('../../toss')
var _ = require('lodash')

module.exports = function (http, admin)
{
	var ctrl = {}

	var express = ctrl.express = Router()

	express.use(http.adminRequired)

	express.post('/intro', (rq, rs) =>
	{
		var by_user_id     = rq.user.id
		var target_user_id = rq.body.target_user_id

		toss(rs, admin.intro(target_user_id, by_user_id))
	})

	express.get('/users',  by_group('users'))
	express.get('/admins', by_group('admins'))

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

			toss(rs, admin.usersList(group, options))
		}
	}

	return ctrl
}

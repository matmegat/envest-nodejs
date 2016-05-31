
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function (http, admin)
{
	var ctrl = {}

	var express = ctrl.express = Router()

	express.use(http.adminRequired)

	express.post('/', (rq, rs) =>
	{
		var by_user_id     = rq.user.id
		var target_user_id = rq.body.target_user_id

		toss(rs, admin.intro(target_user_id, by_user_id))
	})

	return ctrl
}

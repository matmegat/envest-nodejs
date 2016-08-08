
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function (db, http, admin)
{
	var ctrl = {}

	var express = ctrl.express = Router()

	var user_model = db.user

	express.use(http.adminRequired)

	express.post('/intro', (rq, rs) =>
	{
		var by_user_id     = rq.user.id
		var target_user_id = rq.body.target_user_id

		toss(rs, admin.intro(target_user_id, by_user_id))
	})

	express.post('/change-name', (rq, rs) =>
	{
		var whom_id = rq.user.id
		var target_user_id = rq.body.target_user_id

		var credentials = {}

		if ('first_name' in rq.body)
		{
			credentials.first_name = rq.body.first_name
		}

		if ('last_name' in rq.body)
		{
			credentials.last_name = rq.body.last_name
		}

		toss(rs, user_model.changeNameAs(target_user_id, credentials, whom_id))
	})

	return ctrl
}

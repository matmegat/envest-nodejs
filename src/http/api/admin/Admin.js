
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function (db, http, admin)
{
	var ctrl = {}

	var express = ctrl.express = Router()

	var post_model = db.post
	var investor_model = db.investor

	express.use(http.adminRequired)

	express.post('/intro', (rq, rs) =>
	{
		var by_user_id     = rq.user.id
		var target_user_id = rq.body.target_user_id

		toss(rs, admin.intro(target_user_id, by_user_id))
	})

	express.post('/post-as', (rq, rs) =>
	{
		var whom_id = rq.user.id
		var target_user_id = rq.body.target_user_id
		var type = rq.body.type
		var date = rq.body.date
		var data = rq.body.data

		return investor_model.all.ensure(target_user_id)
		.then(() => 
		{
			toss(rs, post_model.createAs(whom_id, target_user_id, type, date, data))
		})
		.catch(toss.err(rs))
	})

	return ctrl
}

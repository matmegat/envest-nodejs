
var _ = require('lodash')

var Router = require('express').Router
var toss = require('../../toss')

module.exports = function Feedback (db, feedback_email)
{
	var feedback = {}

	feedback.model = db.feedback
	feedback.express = Router()

	feedback.express.post('/', (rq, rs) =>
	{
		var data = _.pick(rq.body, 'email', 'title', 'text')

		toss(rs, feedback.model.send(feedback_email, data))
	})

	return feedback
}

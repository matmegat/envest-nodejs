
var pick = require('lodash/pick')

var Router = require('express').Router
var toss = require('../../toss')

module.exports = function Comments (сomments_model)
{
	var сomments = {}

	сomments.model = сomments_model
	сomments.express = Router()

	сomments.express.get('/list', (rq, rs) =>
	{
		var options =
		{
			limit: 10,
			feed_id:  rq.query.feed_id,
			max_id:   rq.query.max_id,
			since_id: rq.query.since_id
		}

		toss(rs, сomments.model.getList(options))
	})

	сomments.express.post('/create', (rq, rs) =>
	{
		var сomment_data = pick(rq.body,
		[
			'feed_id',
			'text'
		])

		сomment_data.user_id = rq.user.id

		toss(rs, сomments.model.create(сomment_data))
	})

	сomments.express.get('/count', (rq, rs) =>
	{
		toss(rs, сomments.model.count(rq.query.feed_id))
	})

	return сomments
}

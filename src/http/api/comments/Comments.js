
var pick = require('lodash/pick')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Comments (сomments_model)
{
	var comments = {}

	comments.model = сomments_model
	comments.express = Router()
	comments.express.use(authRequired)

	comments.express.get('/', (rq, rs) =>
	{
		var options = pick(rq.query,
		[
			'feed_id',
			'max_id',
			'since_id',
		])

		toss(rs, comments.model.list(options))
	})

	comments.express.post('/', (rq, rs) =>
	{
		var comment_data = pick(rq.body,
		[
			'feed_id',
			'text'
		])

		comment_data.user_id = rq.user.id

		toss(rs, comments.model.create(comment_data))
	})

	comments.express.get('/count', (rq, rs) =>
	{
		toss(rs, comments.model.count(rq.query.feed_id))
	})

	return comments
}
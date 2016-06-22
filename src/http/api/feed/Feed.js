
var _ = require('lodash')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Feed (db)
{
	var feed = {}

	feed.model = db.feed
	feed.express = Router()
	feed.express.use(authRequired)

	feed.express.get('/', (rq, rs) =>
	{
		toss(rs, feed.model.list(rq.query))
	})

	feed.express.get('/:id', (rq, rs) =>
	{
		toss(rs, feed.model.byId(rq.params.id))
	})

	feed.express.get('/:id/comments', (rq, rs) =>
	{
		var options = _.pick(rq.query,
		[
			'max_id',
			'since_id',
		])
		options.feed_id = rq.params.id
		options.user_id = rq.user.id

		toss(rs, db.comments.list(options))
	})

	feed.express.post('/:id/comments', (rq, rs) =>
	{
		var comment_data = _.pick(rq.body, [ 'text' ])
		comment_data.feed_id = rq.params.id
		comment_data.user_id = rq.user.id

		toss(rs, db.comments.create(comment_data))
	})

	return feed
}


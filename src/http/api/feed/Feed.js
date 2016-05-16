
var _ = require('lodash')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

var Err = require('../../../Err')
var InvalidParams = Err('invalid_request', 'Invalid request parameters')

module.exports = function Feed (db)
{
	var feed = {}

	feed.model = db.feed
	feed.express = Router()
	feed.express.use(authRequired)

	feed.express.get('/', (rq, rs) =>
	{
		var options = _.pick(rq.query,
		[
			'max_id',
			'since_id'
		])

		toss(rs, feed.model.list(options))
	})

	feed.express.get('/:id', (rq, rs) =>
	{
		var id = _.toNumber(rq.params.id)
		if (_.isNaN(id))
		{
			return toss.err(rs, InvalidParams())
		}

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

		toss(rs, db.comments.list(options))
	})

	feed.express.post('/:id/comments', (rq, rs) =>
	{
		var comment_data = _.pick(rq.body, [ 'text' ])
		comment_data.feed_id = rq.params.id

		toss(rs, db.comments.create(comment_data))
	})

	return feed
}


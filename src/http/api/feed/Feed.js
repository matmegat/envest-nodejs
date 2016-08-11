
var _ = require('lodash')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Feed (db, http)
{
	var feed = {}

	feed.model = db.feed
	feed.post = db.post
	feed.express = Router()
	feed.express.use(authRequired)

	var filters =
	[
		'type',
		'investors',
		'investor',
		'last_days',
		'last_weeks',
		'last_months',
		'last_years',
		'name',
		'mindate',
		'maxdate',
		'symbols'
	]

	feed.express.get('/', (rq, rs) =>
	{
		var options = {}

		options.filter = _.pick(rq.query, filters)

		options.paginator = _.pick(rq.query,
		[
			'max_id',
			'since_id',
			'page'
		])

		toss(rs, feed.model.list(options, rq.user.id))
	})

	feed.express.get('/counts', (rq, rs) =>
	{
		var options = _.pick(rq.query, filters)

		toss(rs, feed.model.counts(options))
	})

	feed.express.get('/trades',  by_type('trade'))
	feed.express.get('/updates', by_type('update'))

	function by_type (type)
	{
		return function (rq, rs)
		{
			var options = {}

			options.paginator = _.pick(rq.query,
			[
				'max_id',
				'since_id',
				'page'
			])

			options.filter = _.pick(rq.query,
			[
				'investor'
			])

			options.filter.type = type

			toss(rs, feed.model.list(options, rq.user.id))
		}
	}

	feed.express.get('/by-watchlist', (rq, rs) =>
	{
		toss(rs, feed.model.byWatchlist(rq.user.id))
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

	feed.express.post('/post', http.investorRequired, (rq, rs) =>
	{
		var investor_id = rq.user.id
		var type = rq.body.type
		var data = rq.body.data
		var date = rq.body.date

		toss(rs, feed.post.create(investor_id, type, date, data))
	})

	return feed
}




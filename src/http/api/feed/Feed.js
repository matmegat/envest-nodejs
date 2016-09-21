
var pick = require('lodash/pick')

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Feed (db, http)
{
	var feed = {}

	feed.model = db.feed
	feed.post = db.post
	feed.investor = db.investor

	feed.express = Router()
	feed.express.use(authRequired)

	var filter_by =
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

	var paginate_by =
	[
		'max_id',
		'since_id',
		'page'
	]

	feed.express.get('/', (rq, rs) =>
	{
		var options = {}

		options.filter = pick(rq.query, filter_by)

		options.paginator = pick(rq.query, paginate_by)

		toss(rs, feed.model.list(options, rq.user.id))
	})

	feed.express.get('/counts', (rq, rs) =>
	{
		var options = pick(rq.query, filter_by)

		toss(rs, feed.model.counts(options))
	})

	feed.express.get('/trades',  by_type('trade'))
	feed.express.get('/updates', by_type('update'))

	function by_type (type)
	{
		return function (rq, rs)
		{
			var options = {}

			options.paginator = pick(rq.query,
			[
				'max_id',
				'since_id',
				'page'
			])

			options.filter = pick(rq.query, 'investor')

			options.filter.type = type

			toss(rs, feed.model.list(options, rq.user.id))
		}
	}

	feed.express.get('/by-watchlist', (rq, rs) =>
	{
		var options = { filter: pick(rq.query, 'type') }

		options.paginator = pick(rq.query, paginate_by)

		toss(rs, feed.model.byWatchlist(rq.user.id, options))
	})

	feed.express.get('/:id', (rq, rs) =>
	{
		toss(rs, feed.model.byId(rq.params.id, rq.user.id))
	})

	feed.express.get('/:id/comments', (rq, rs) =>
	{
		var options = pick(rq.query,
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
		var comment_data = pick(rq.body, 'text')
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

	feed.express.post('/post/update', http.investorRequired, (rq, rs) =>
	{
		var investor_id = rq.user.id
		var post_id = rq.body.post_id

		var data = rq.body.data
		var date = rq.body.date

		toss(rs, feed.post.update(investor_id, post_id, date, data))
	})

	feed.express.post('/post-as', http.adminRequired, (rq, rs) =>
	{
		var whom_id = rq.user.id
		var target_user_id = rq.body.target_user_id

		var type = rq.body.type
		var date = rq.body.date
		var data = rq.body.data

		return feed.investor.all.ensure(target_user_id)
		.then(() =>
		{
			toss(rs,
				feed.post.createAs(whom_id, target_user_id, type, date, data))
		})
		.catch(toss.err(rs))
	})

	feed.express.post('/post-as/update', http.adminRequired, (rq, rs) =>
	{
		var whom_id = rq.user.id
		var post_id = rq.body.post_id

		var data = rq.body.data
		var date = rq.body.date

		toss(rs, feed.post.updateAs(whom_id, post_id, date, data))
	})

	feed.express.delete('/post/delete', http.investorRequired, (rq, rs) =>
	{
		var investor_id = rq.user.id
		var post_id = rq.body.post_id
		var soft_mode = rq.body.soft_mode

		toss(rs, feed.post.remove(investor_id, post_id, null, soft_mode))
	})

	feed.express.delete('/post-as/delete', http.adminRequired, (rq, rs) =>
	{
		var whom_id = rq.user.id
		var target_user_id = rq.body.target_user_id
		var post_id = rq.body.post_id
		var soft_mode = rq.body.soft_mode

		toss(rs, feed.post.remove(target_user_id, post_id, whom_id, soft_mode))
	})

	return feed
}




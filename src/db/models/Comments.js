
var Paginator = require('../Paginator')

var _ = require('lodash')
var noop = _.noop

module.exports = function Comments (db)
{
	var comments = {}

	var knex = db.knex

	var one  = db.helpers.one

	var paginator = Paginator({ column_name: 'comments.id' })

	comments.table = () => knex('comments')

	comments.list = function (options)
	{
		return db.feed.validateFeedId(options.feed_id)
		.then(() =>
		{
			var comments_queryset = byId(options.feed_id)

			return paginator.paginate(comments_queryset, options)
		})
	}

	function byId (feed_id)
	{
		return comments.table()
		.select(
			'comments.id',
			'timestamp',
			'text',
			'user_id',
			'users.full_name'
		)
		.innerJoin('users', 'comments.user_id', 'users.id')
		.where('feed_id', feed_id)
	}


	comments.create = function (data)
	{
		return comments.table()
		.insert(data)
		.then(noop)
	}


	comments.count = function (feed_id)
	{
		return db.feed.validateFeedId(feed_id)
		.then(() =>
		{
			return comments.table()
			.count('id')
			.where('feed_id', feed_id)
			.then(one)
		})
		.then(row => row.count)
	}


	var at  = require('lodash/fp/at')
	var zip = _.fromPairs
	var mapValues = _.mapValues
	var toNumber = _.toNumber

	comments.countMany = function (feed_ids)
	{
		return comments.table()
		.select('feed_id')
		.count('id as count')
		.whereIn('feed_id', feed_ids)
		.groupBy('feed_id')
		.then(seq =>
		{
			seq = seq.map(at([ 'feed_id', 'count' ]))

			seq = zip(seq)

			seq = mapValues(seq, toNumber)

			return seq
		})
	}

	return comments
}

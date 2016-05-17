
var Paginator = require('./Paginator')
var Err = require('../Err')

var _ = require('lodash')
var noop = _.noop

module.exports = function Comments (db)
{
	var comments = {}

	comments.db = db

	var knex = db.knex
	var one  = db.one

	var paginator = Paginator({ column_name: 'comments.id' })

	comments.table = () => knex('comments')

	comments.list = function (options)
	{
		return comments.validate_feed_id(options.feed_id)
		.then(() =>
		{
			var comments_queryset = byId(options.feed_id)

			return paginator.paginate(comments_queryset, options)
		})
	}


	var toId = require('../toId')
	var WrongFeedId = Err('wrong_feed_id', 'Wrong feed id')

	comments.validate_feed_id = function (feed_id)
	{
		return new Promise(rs =>
		{
			feed_id = toId(feed_id)

			if (! feed_id)
			{
				throw WrongFeedId()
			}

			return rs()
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
		return comments.validate_feed_id(feed_id)
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



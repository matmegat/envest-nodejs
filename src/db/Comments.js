
var Paginator = require('./Paginator')
var Err = require('../Err')

var _ = require('lodash')

var toNumber     = _.toNumber
var isInteger    = _.isInteger

module.exports = function Comments (db)
{
	var comments = {}

	comments.db = db

	var knex = db.knex
	var one = db.one
	var noop = _.noop

	comments.table = () => knex('comments')

	comments.getList = function (options)
	{
		return validate_feed_id(options.feed_id)
		.then(() =>
		{
			var comments_queryset = byFeedId(options.feed_id)

			return Paginator(comments_queryset, options, 'comments.id')
		})
	}

	comments.create = function (data)
	{
		return comments.table()
		.insert(data)
		.then(noop)
	}

	comments.count = function (feed_id)
	{
		return validate_feed_id(feed_id)
		.then(() =>
		{
			return comments.table()
			.count('id')
			.where('feed_id', feed_id)
			.then(one)
		})
	}

	function byFeedId (feed_id)
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

	return comments
}

var WrongFeedId = Err('wrong_feed_id', 'Wrong feed id')

function validate_feed_id (feed_id)
{
	return new Promise(rs =>
	{
		if (! isInteger(toNumber(feed_id)) || feed_id <= 0)
		{
			throw WrongFeedId()
		}

		return rs()
	})
}


var expect = require('chai').expect

var Paginator = require('../paginator/Ordered')
var Abuse     = require('./Abuse')

var validate = require('../validate')
var validateId = require('../../id').validate

var Err = require('../../Err')

var _ = require('lodash')
var noop = _.noop

module.exports = function Comments (db)
{
	var comments = {}

	var knex = db.knex

	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	var paginator = Paginator({ order_column: 'comments.id' })

	expect(db, 'Comments depends on User').property('user')
	var user = db.user

	comments.table = () => knex('comments')
	comments.abuse = Abuse(db, comments)

	comments.list = function (options)
	{
		return db.feed.validateFeedId(options.feed_id)
		.then(() =>
		{
			var comments_queryset = byFeedId(options.feed_id, options.user_id)

			return paginator.paginate(comments_queryset, options)
		})
		.then((comments_items) =>
		{
			return user.list(_.map(comments_items, 'user_id'))
			.then((users) =>
			{
				var response =
				{
					comments: comments_items,
					users: users
				}

				return response
			})
		})
	}

	function byFeedId (feed_id, user_id)
	{
		return comments.table()
		.select(
			'comments.id',
			'comments.timestamp',
			'text',
			'comments.user_id',
			knex.raw('abuse_comments.comment_id IS NOT NULL AS is_abuse')
		)
		.leftJoin('abuse_comments', function ()
		{
			this.on('abuse_comments.comment_id', '=', 'comments.id')
			.andOn('abuse_comments.user_id', '=', user_id)
		})
		.where('feed_id', feed_id)
	}

	comments.create = function (data)
	{
		return new Promise(rs =>
		{
			validate.required(data.user_id, 'user_id')
			validate.required(data.feed_id, 'feed_id')
			validate.required(data.text, 'text')
			validate.empty(data.text, 'text')

			return rs(data)
		})
		.then(data =>
		{
			return comments.table()
			.insert(data)
			.then(noop)
			.catch(Err.fromDb('comments_feed_id_foreign', db.feed.NotFound))
		})
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


	var WrongCommentId = Err('wrong_comment_id', 'Wrong comment id')

	function validate_id (id)
	{
		return new Promise(rs =>
		{
			return rs(validateId(id, WrongCommentId))
		})
	}

	comments.byId = function (id)
	{
		return validate_id(id)
		.then(() =>
		{
			return comments.table()
			.where('id', id)
			.then(oneMaybe)
		})
	}

	return comments
}

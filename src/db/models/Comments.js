
var Paginator = require('../Paginator')

var Err = require('../../Err')

var _ = require('lodash')
var noop = _.noop

module.exports = function Comments (db)
{
	var comments = {}

	var knex = db.knex

	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	var paginator = Paginator({ column_name: 'comments.id' })

	comments.table = () => knex('comments')
	comments.abuse_table = () => knex('abuse_comments')

	comments.list = function (options)
	{
		return comments.validate_id(options.feed_id)
		.then(() =>
		{
			var comments_queryset = byFeedId(options.feed_id)

			return paginator.paginate(comments_queryset, options)
		})
	}


	var toId = require('../../toId')
	var WrongId = Err('wrong_id', 'Wrong id')

	comments.validate_id = function (id)
	{
		return new Promise(rs =>
		{
			id = toId(id)

			if (! id)
			{
				throw WrongId()
			}

			return rs()
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


	comments.create = function (data)
	{
		return comments.table()
		.insert(data)
		.then(noop)
	}


	comments.count = function (feed_id)
	{
		return comments.validate_id(feed_id)
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

	var CommentNotExist = Err('comment_not_exist', 'Comment not exist')

	comments.abuse = function (user_id, comment_id)
	{
		return comments.byId(comment_id)
		.then(Err.nullish(CommentNotExist))
		.then(() =>
		{
			return comments.abuse_table()
			.insert({
				user_id: user_id,
				comment_id: comment_id
			})
			.then(noop)
		})
	}

	comments.byId = function (id)
	{
		return comments.validate_id(id)
		.then(() =>
		{
			return comments.table()
			.where('id', id)
			.then(oneMaybe)
		})
	}

	return comments
}

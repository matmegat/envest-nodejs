
var expect = require('chai').expect

var Paginator = require('../paginator/Ordered')
var Abuse     = require('./Abuse')

var validate = require('../validate')

var Err = require('../../Err')

var _ = require('lodash')
var noop = _.noop
var map  = _.map

module.exports = function Comments (db)
{
	var comments = {}

	var knex = db.knex

	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	expect(db, 'Comments depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	expect(db, 'Comments depends on User').property('user')
	var user = db.user

	expect(db, 'Comments depends on Admin').property('admin')
	var admin = db.admin


	comments.table = () => knex('comments')
	comments.abuse = Abuse(db, comments, Emitter)

	var paginator = Paginator({ order_column: 'comments.id' })


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
			return Promise.all(
			[
				user.list(map(comments_items, 'user_id')),
				comments.count(options.feed_id)
			])
			.then(so =>
			{
				var response =
				{
					comments: comments_items,
					users: so[0],
					count: so[1]
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

	var NewFeedComment = Emitter('new_feed_comment', { same_id: 'user' })
	var validate_comment_length = validate.length(1200)

	comments.create = function (data)
	{
		return new Promise(rs =>
		{
			validate.required(data.user_id, 'user_id')
			validate.required(data.feed_id, 'feed_id')
			validate.required(data.text, 'text')
			validate.empty(data.text, 'text')
			validate_comment_length(data.text, 'text')

			return rs(data)
		})
		.then(data =>
		{
			return comments.table()
			.insert(data, 'id')
			.then(one)
			.catch(Err.fromDb('comments_feed_id_foreign', db.feed.NotFound))
		})
		.then((comment_id) =>
		{
			return db.feed.byId(data.feed_id, data.user_id)
			.then(feed_item =>
			{
				var target_id = feed_item.investor.id
				var emitter_id = data.user_id

				NewFeedComment(target_id,
				{
					feed_id: feed_item.id,
					comment_id: comment_id,
					user: [ ':user-id', emitter_id ]
				})
			})
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
		.then(Number)
	}

	var find = require('lodash/find')
	var fromPairs = _.fromPairs

	comments.countMany = function (feed_ids)
	{
		return comments.table()
		.select('feed_id')
		.count('id as count')
		.whereIn('feed_id', feed_ids)
		.groupBy('feed_id')
		.then(seq =>
		{
			var counts = feed_ids.map(id =>
			{
				var c = find(seq, [ 'feed_id', id ])

				if (c)
				{
					c = Number(c.count)
				}
				else
				{
					c = 0
				}

				return [ id, c ]
			})

			counts = fromPairs(counts)

			return counts
		})
	}

	var WrongCommentId = Err('wrong_comment_id', 'Wrong comment id')
	var validate_id = require('../../id').validate.promise(WrongCommentId)

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

	comments.CommentNotFound = Err('comment_not_found',
	'Comment not found')

	var AdminOwnerRequired = Err('admin_owner_required',
	'You must be the administrator or owner of feed post')

	comments.remove = function (user_id, id)
	{
		return comments.byId(id)
		.then(Err.nullish(comments.CommentNotFound))
		.then(() =>
		{
			return comments.ensureDelete(user_id, id)
		})
		.then(() =>
		{
			return comments.table()
			.where('id', id)
			.delete()
		})
		.then(noop)
	}

	comments.ensureDelete = function (user_id, id)
	{
		return admin.is(user_id)
		.then((is_admin) =>
		{
			if (! is_admin)
			{
				return comments.table()
				.innerJoin('feed_items',
				'feed_items.id', 'comments.feed_id ')
				.where('comments.id', id)
				.where('investor_id', user_id)
				.then(Err.emptish(AdminOwnerRequired))
			}
		})
	}

	return comments
}

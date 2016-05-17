var _ = require('lodash')

var Paginator = require('./Paginator')
var Comments  = require('./Comments')
var Err = require('../Err')
var NotFound = Err('not_found', 'Feed Item not found')

module.exports = function Feed (db)
{
	var feed = {}

	feed.db = db

	var knex = db.knex
	var oneMaybe = db.oneMaybe

	var paginator = Paginator()
	var comments  = Comments(db)

	feed.feed_table = () => knex('feed_items')
	feed.investors_table = () => knex('investors')
	feed.comments_table = () => knex('comments')

	feed.byId = function (id)
	{
		return feed.feed_table()
		.where('id', id)
		.then(oneMaybe)
		.then((feed_item) =>
		{
			return feed
			.investors_table()
			.where('id', feed_item.investor_id)
			.then((investor) =>
			{
				feed_item.investor = investor
				delete feed_item.investor_id

				return feed_item
			})
		})
		.then((feed_item) =>
		{
			return comments.count(feed_item.id)
			.then((count) =>
			{
				feed_item.comments = count

				return feed_item
			})
		})
		.then(Err.nullish(NotFound))
	}


	feed.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20
		})

		return paginator.paginate(feed.feed_table(), options)
		.then((feed_items) =>
		{
			var feed_ids = _.map(feed_items, 'id')

			return comments
			.countMany(feed_ids)
			.then((commentsCount) =>
			{
				feed_items.forEach((item) =>
				{
					var comments = commentsCount[item.id]

					if (comments)
					{
						comments = _.toNumber(comments)
					}

					item.comments = comments || 0
				})

				return feed_items
			})
		})
		.then((feed_items) =>
		{
			return feed.investors_table()
			.whereIn('id', _.map(feed_items, 'investor_id'))
			.then((investors) =>
			{
				var response =
				{
					feed: feed_items,
					investors: investors,
				}

				return response
			})
		})
	}

	return feed
}

var _ = require('lodash')
var Err = require('../Err')
var NotFound = Err('not_found', 'Feed Item not found')

module.exports = function Feed (db)
{
	var feed = {}

	feed.db = db

	var knex = db.knex
	var oneMaybe = db.oneMaybe

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
			return feed
			.comments_table()
			.where('feed_id', feed_item.id)
			.then((comments) =>
			{
				feed_item.comments = comments.length

				return feed_item
			})
		})
		.then(Err.nullish(NotFound))
	}

	feed.getList = function (options)
	{
		options = options || {}
		options.limit = options.limit || 20

		var feed_queryset = feed.feed_table()
		.orderBy('timestamp', 'desc')
		.limit(options.limit)

		if (options.since_id)
		{
			feed_queryset
			.where('id', '>', options.since_id)
		}
		if (options.max_id)
		{
			feed_queryset
			.where('id', '<=', options.max_id)
		}

		return feed_queryset
		.then((feed_items) =>
		{
			return feed.comments_table()
			.select('feed_id')
			.count('id as count')
			.whereIn('feed_id', _.map(feed_items, 'id'))
			.groupBy('feed_id')
			.then((commentsCount) =>
			{
				feed_items.forEach((item) =>
				{
					var comments = _.find(commentsCount, { feed_id: item.id })
					if (comments)
					{
						comments = _.toNumber(comments.count)
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

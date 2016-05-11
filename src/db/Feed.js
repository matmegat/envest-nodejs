var _ = require('lodash')

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
	}

	feed.getList = function (options)
	{
		options = options || {}
		options.limit = options.limit || 20

		var feed_queryset = feed.feed_table()
		.orderBy('timestamp', 'desc')
		.limit(options.limit)

		if (options.since_id && options.max_id)
		{
			feed_queryset
			.whereBetween('id',
			[
				options.since_id,
				options.since_id + options.max_id
			])
		}
		else if (options.since_id)
		{
			feed_queryset
			.where('id', '>', options.since_id)
		}
		else if (options.max_id)
		{
			feed_queryset
			.where('id', '<=', options.max_id)
		}

		return feed_queryset
		.then((feed_items) =>
		{
			return feed.investors_table()
			.whereIn('id', _.map(feed_items, 'investor_id'))
			.then((investors) =>
			{
				feed_items.forEach((i, item) =>
				{
					item.investor = _.find(investors, { id: item.investor_id })
					delete item.investor_id
				})

				return feed_items
			})
		})
		.then((feed_items) =>
		{
			return feed.comments_table()
			.select('feed_id')
			.count('id as count')
			.whereIn('feed_id', _.map(feed_items, 'id'))
			.groupBy('feed_id')
			.then((commentsCount) =>
			{
				feed_items.forEach((i, item) =>
				{
					var comments = _.find(commentsCount, { feed_id: item.id })
					if (comments)
					{
						comments = comments.count
					}

					item.comments = comments || 0
				})

				return feed_items
			})
		})
	}

	return feed
}

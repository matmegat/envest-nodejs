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

		if (options.afterId)
		{
			feed_queryset = feed_queryset
				.where('id', '<', options.afterId)
		}

		return new Promise((resolve, reject) =>
		{
			feed_queryset
			.then((feed_iems) =>
			{
				Promise
				.all(
				[
					feed.investors_table()
						.whereIn('id', _.map(feed_iems, (item) =>
						{
							return item.investor_id
						})),

					feed.comments_table()
						.select('feed_id')
						.whereIn('feed_id', _.map(feed_iems, (item) =>
						{
							return item.id
						}))
						.groupBy('feed_id')
				])
				.then((investors, comments) =>
				{
					console.log('investors', investors)
					console.log('comments', comments)
					resolve(feed_iems)
				})
			})
			.catch((error) =>
			{
				reject(error)
			})
		})
	}

	return feed
}

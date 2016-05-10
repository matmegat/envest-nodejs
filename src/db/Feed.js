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
			.then((feed_items) =>
			{
				Promise
				.all(
				[
					feed.investors_table()
						.whereIn('id', _.map(feed_items, (item) =>
						{
							return item.investor_id
						})),

					feed.comments_table()
						.select('feed_id')
						.count('id as count')
						.whereIn('feed_id', _.map(feed_items, (item) =>
						{
							return item.id
						}))
						.groupBy('feed_id')
				])
				.then((response) =>
				{
					var investors = _.cloneDeep(response[0])
					var commentsCount = _.cloneDeep(response[1])

					_.each(feed_items, (item) =>
					{
						var comments = _.find(commentsCount, { feed_id: item.id })
						if (comments)
						{
							comments = comments.count
						}

						item.comments = comments || 0
						item.investor = _.find(investors, { id: item.investor_id })
						delete item.investor_id
					})

					resolve(feed_items)
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

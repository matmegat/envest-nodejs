
var _ = require('lodash')
var Router = require('express').Router

module.exports = function Feed (feed_model)
{
	var feed = {}

	feed.model = feed_model
	feed.express = Router()

	feed.express.use((req, res, next) =>
	{
		if (! req.user)
		{
			return res.status(403).json(
				{
					status: false,
					message: 'Not authenticated'
				})
		}

		next()
	})

	feed.express.get('/', (rq, rs) =>
	{
		var options =
		{
			limit: 10
		}

		if (_.isNaN(_.toNumber(rq.query.limit)))
		{
			options.limit = rq.query.limit
		}

		if (_.isNaN(_.toNumber(rq.query.afterId)))
		{
			options.afterId = rq.query.afterId
		}

		feed.model.getList(options)
			.then((feed) =>
			{
				return rs.status(200).json(
					{
						status: true,
						response: feed
					})
			})
			.catch((error) =>
			{
				return rs.status(500).json(
					{
						status: false,
						error: error.message
					})
			})
	})

	return feed
}

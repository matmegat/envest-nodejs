
var _ = require('lodash')
var Router = require('express').Router
var toss = require('../../toss')
var Err = require('../../../Err')
var Unauthorized = Err('unauthorized', 'You are not logged in')

module.exports = function Feed (feed_model)
{
	var feed = {}

	feed.model = feed_model
	feed.express = Router()

	feed.express.use((req, res, next) =>
	{
		if (! req.user)
		{
			return toss.err(res, Unauthorized())
		}

		next()
	})

	feed.express.get('/', (rq, rs) =>
	{
		var options =
		{
			limit: 10
		}

		rq.query.limit = _.toNumber(rq.query.limit)
		if (_.isNaN())
		{
			options.limit = rq.query.limit
		}

		// TODO: clarify reqs for pagination and uncomment
		// rq.query.afterId = _.toNumber(rq.query.afterId)
		// if (! _.isNaN(rq.query.afterId))
		// {
		// 	options.afterId = rq.query.afterId
		// }

		feed.model.getList(options)
			.then((feed) =>
			{
				return rs.status(200).json(
				{
					status: true,
					response: feed
				})
			})
			.catch(toss.err(rs))
	})

	return feed
}

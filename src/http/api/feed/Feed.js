
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
		if (! _.isNaN(rq.query.limit))
		{
			options.limit = rq.query.limit
		}

		rq.query.max_id = _.toNumber(rq.query.max_id)
		if (! _.isNaN(rq.query.max_id))
		{
			options.max_id = rq.query.max_id
		}

		rq.query.since_id = _.toNumber(rq.query.since_id)
		if (! _.isNaN(rq.query.since_id))
		{
			options.since_id = rq.query.since_id
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
			.catch(toss.err(rs))
	})

	return feed
}

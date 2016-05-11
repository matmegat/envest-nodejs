
var _ = require('lodash')
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function Feed (feed_model)
{
	var feed = {}

	feed.model = feed_model
	feed.express = Router()

	feed.express.get('/', (rq, rs) =>
	{
		var options =
		{
			limit: 10
		}

		var max_id = _.toNumber(rq.query.max_id)
		if (! _.isNaN(max_id))
		{
			options.max_id = max_id
		}

		var since_id = _.toNumber(since_id)
		if (! _.isNaN(since_id))
		{
			options.since_id = since_id
		}

		feed
		.model
		.getList(options)
		.then(toss(rs))
		.catch(toss.err(rs))
	})

	return feed
}

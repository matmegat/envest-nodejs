
var _ = require('lodash')
var toNumber = _.toNumber
var isNaN    = _.isNaN

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Feed (feed_model)
{
	var feed = {}

	feed.model = feed_model
	feed.express = Router()
	feed.express.use(authRequired)

	feed.express.get('/', (rq, rs) =>
	{
		var options =
		{
			limit: 10
		}

		var max_id = toNumber(rq.query.max_id)
		if (! isNaN(max_id))
		{
			options.max_id = max_id
		}

		var since_id = toNumber(since_id)
		if (! isNaN(since_id))
		{
			options.since_id = since_id
		}

		toss(rs, feed.model.getList(options))
	})

	return feed
}

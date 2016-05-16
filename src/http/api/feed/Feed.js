var _ = require('lodash')
var toNumber = _.toNumber
var isNaN    = _.isNaN

var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var InvalidParams = Err('invalid_request', 'Invalid request parameters')

module.exports = function Feed (feed_model)
{
	var feed = {}

	feed.model = feed_model
	feed.express = Router()
	feed.express.use(authRequired)

	feed.express.get('/', (rq, rs) =>
	{
		var options = {}

		var max_id = toNumber(rq.query.max_id)	// TODO: отрефакторить в toId
		if (! isNaN(max_id))
		{
			options.max_id = max_id
		}

		var since_id = toNumber(rq.query.since_id)	// TODO: отрефакторить в toId
		if (! isNaN(since_id))
		{
			options.since_id = since_id
		}

		toss(rs, feed.model.List(options))
	})

	feed.express.get('/:id', (rq, rs) =>
	{
		var id = _.toNumber(rq.params.id)
		if (_.isNaN(id))
		{
			return toss.err(rs, InvalidParams())
		}

		toss(rs, feed.model.byId(rq.params.id))
	})

	return feed
}

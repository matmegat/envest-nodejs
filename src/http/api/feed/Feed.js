
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

var Comments = require('./Comments')

var Err = require('../../../Err')
var InvalidParams = Err('invalid_request', 'Invalid request parameters')

module.exports = function Feed (db)
{
	var feed = {}

	feed.model = db.feed
	feed.express = Router()
	feed.express.use(authRequired)
	feed.express.use('/comments', Comments(db.comments).express)

	feed.express.get('/', (rq, rs) =>
	{
		var options =
		{
			limit: 10,
			max_id:   rq.query.max_id,
			since_id: rq.query.since_id
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


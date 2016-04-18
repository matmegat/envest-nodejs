
var Router = require('express').Router

module.exports = function Feed ()
{
	var feed = {}

	feed.express = Router()

	feed.express.get('/latest', (rq, rs) =>
	{
		rs.json({ ok: true })
	})

	return feed
}

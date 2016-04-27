
var express = require('express')

var Feed = require('./Feed')

module.exports = function Http (app)
{
	var http = {}

	http.express = express()

	http.feed = Feed()
	http.express.use('/api/feed', http.feed.express)

	if (app.cfg.env !== 'prod') 
	{
		require('./Swagger')(app, http.express)
	}

	var port = app.cfg.port

	http.ready = new Promise(rs =>
	{
		http.express.listen(port, rs)
	})

	return http
}


var express = require('express')

var Feed = require('./Feed')

module.exports = function Http ()
{
	var http = {}

	http.express = express()

	http.feed = Feed()
	http.express.use('/api/feed', http.feed.express)

	var port = 8080

	http.express.listen(port, () => console.info('NetVest backend at :%s', port))

	return http
}

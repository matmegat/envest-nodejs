
var Router = require('express').Router

var stream = require('fs').createReadStream

module.exports = function Statics (rootpath)
{
	var statics = {}
	var filename = rootpath('static/images/default.png')

	statics.express = Router()

	statics.express.get('/pic/:hash', (rq, rs) =>
	{
		console.log('Getting image by hash: `%s`', rq.params.hash)

		rs.setHeader('content-type', 'image/png')
		stream(filename).pipe(rs)
	})

	return statics
}

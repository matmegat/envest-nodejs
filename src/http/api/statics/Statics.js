
var Router = require('express').Router

var stream = require('fs').createReadStream
var mime = require('mime')

module.exports = function Statics (rootpath)
{
	var statics = {}
	var filename = rootpath('static/images/default.png')

	statics.express = Router()

	statics.express.get('/pic/:hash', (rq, rs) =>
	{
		console.log('Getting image by hash: `%s`', rq.params.hash)

		Promise.resolve()
		.then(() =>
		{
			return mime.lookup(filename)
		})
		.then(type =>
		{
			rs.setHeader('content-type', type)
			stream(filename).pipe(rs)
		})
	})

	return statics
}

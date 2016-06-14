
var Router = require('express').Router

var stream = require('fs').createReadStream
var mime = require('mime')
var busboy = require('connect-busboy')

module.exports = function Statics (rootpath)
{
	var statics = {}
	var filename = rootpath('static/images/default.png')

	statics.express = Router()

	statics.express.get('/pic/:hash', (rq, rs) =>
	{
		var type = mime.lookup(filename)

		rs.setHeader('content-type', type)
		stream(filename).pipe(rs)
	})

	return statics
}

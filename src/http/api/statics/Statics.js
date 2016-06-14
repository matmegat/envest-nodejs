
var Router = require('express').Router

var authRequired = require('../../auth-required')

var fs = require('fs')
var mime = require('mime')
var multer = require('multer')

module.exports = function Statics (rootpath)
{
	var statics = {}
	var default_filename = rootpath('static/images/default.png')

	statics.express = Router()

	statics.express.get('/pic/:hash', (rq, rs) =>
	{
		fs.access(rootpath('static/images/', rq.params.hash), fs.F_OK, (err) =>
		{
			var type = mime.lookup(default_filename)
			var filename = default_filename

			if (! err)
			{
				type = mime.lookup(rootpath('static/images/', rq.params.hash))
				filename = rootpath('static/images/', rq.params.hash)
			}

			rs.setHeader('content-type', type)
			fs.createReadStream(filename).pipe(rs)
		})
	})


	var storage = multer.diskStorage({
		destination: (rq, file, done) =>
		{
			done(null, rootpath('static/images/'))
		},
		filename: (rq, file, done) =>
		{
			console.log(file)
			done(null, file.fieldname + '.png')
		}
	})
	var upload = multer({ storage: storage })

	statics.express.post('/pic/upload', upload.single('avatar'), /*authRequired,*/ (rq, rs) =>
	{
		console.log('pic/upload route')

		console.log(rq.file)
		rs.end()
	})

	return statics
}

'use strict'

var Router = require('express').Router

var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var toss = require('../../toss')

var fs = require('fs')
var picfs = require('./fs')

var mime = require('mime')
var multer = require('multer')

module.exports = function Statics (rootpath, db)
{
	var statics = {}
	statics.user_model = db.user

	var default_filename = rootpath('static/images/default.png')

	statics.fs = picfs(rootpath)

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

	var upload_pic = multer().single('user_pic')
	var UploadError = Err('upload_error', 'Upload error')

	statics.express.post('/pic/upload',
		authRequired,
		(rq, rs) =>
	{
		upload_pic(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			var file = rq.file
			var user_id = rq.user.id

			statics.fs.save(file)
			.then(hash =>
			{
				return statics.user_model.addPic(
				{
					user_id: user_id,
					hash: hash
				})
			})

			rs.end()
		})
	})

	return statics
}

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

	var MimeError = Err('wrong_file', 'File has no mimetype')

	var upload_pic = multer({
		fileFilter: function (req, file, done)
		{
			if (! file.mimetype)
			{
				done(MimeError())
			}

			done(null, true)
		}
	})
	.single('user_pic')

	var UploadError = Err('upload_error', 'Upload error')

	statics.express.post('/pic/upload', authRequired, (rq, rs) =>
	{
		upload_pic(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			var file = rq.file
			var user_id = rq.user.id

			statics.user_model.picByUserId(user_id)
			.then(result =>
			{
				var pic = result.pic || ''

				if (pic)
				{
					return statics.fs.remove(pic)
				}
			})
			.then(() =>
			{
				return statics.fs.save(file)
			})
			.then(filename =>
			{
				return statics.user_model.updatePic(
				{
					user_id: user_id,
					hash: filename
				})
			})
			.then(() =>
			{
				rs.end()
			})
		})
	})

	return statics
}

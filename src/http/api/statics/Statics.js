'use strict'

var Router = require('express').Router

var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var toss = require('../../toss')

var fs = require('fs')

var mime = require('mime')
var multer = require('multer')

module.exports = function Statics (rootpath, db)
{
	var statics = {}
	statics.user_model = db.user

	var default_filename = rootpath('static/images/default.png')

	statics.static_model = db.static

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

	var UploadError = Err('upload_error', 'Upload error')

	var upload_pic = multer().single('user_pic')

	statics.express.post('/pic/upload', authRequired, (rq, rs) =>
	{
		upload_pic(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			toss(rs, statics.static_model.upload_pic(rq))
		})
	})

	var investor_bg = multer().single('investor_bg')

	statics.express.post('/bg/upload', authRequired, (rq, rs) =>
	{
		investor_bg(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			toss(rs, statics.static_model.upload_profile_pic(rq))
		})
	})

	return statics
}

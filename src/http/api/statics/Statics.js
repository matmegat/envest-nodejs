'use strict'

var Router = require('express').Router

var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var toss = require('../../toss')

var fs = require('fs')

var multer = require('multer')

module.exports = function Statics (rootpath, db, http)
{
	var statics = {}
	statics.static_model = db.static
	statics.pic_model = db.pic

	statics.express = Router()

	var AccessErr = Err('static_img_access_denied', 'Static Img Access Denied')

	statics.express.get('/pic/:hash', (rq, rs) =>
	{
		fs.access(rootpath('static/images/', rq.params.hash), fs.F_OK, (err) =>
		{
			if (err)
			{
				toss.err(AccessErr)
			}

			var hash = rq.params.hash

			statics.static_model.get(hash)
			.then(file_data =>
			{
				rs.setHeader('content-type', file_data.type)
				file_data.stream.pipe(rs)
			})
			.catch(() =>
			{
				rs.sendStatus(404)
			})
		})
	})

	var UploadError = Err('upload_error', 'Upload error')

	var pic = multer().single('pic')

	statics.express.post('/upload/pic', authRequired, (rq, rs) =>
	{
		pic(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			toss(rs, statics.pic_model.update(rq.file, rq.user.id))
		})
	})

	var profile_pic = multer().single('profile_pic')

	statics.express.post('/upload/profile_pic', http.investorRequired, (rq, rs) =>
	{
		profile_pic(rq, rs, (err) =>
		{
			if (err)
			{
				return toss.err(rs, UploadError(err))
			}

			toss(rs, statics.pic_model.updateProfile(rq.file, rq.user.id))
		})
	})

	return statics
}

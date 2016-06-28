'use strict'

var Router = require('express').Router

var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var toss = require('../../toss')

var fs = require('fs')

var mime = require('mime')
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
			.then(rs_obj =>
			{
				rs.setHeader('content-type', rs_obj.type)
				rs_obj.stream.pipe(rs)
			})
			.catch(() => 
			{
				rs.send(404)
			})
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

			toss(rs, statics.pic_model.update(rq.file, rq.user.id))
		})
	})

	var investor_bg = multer().single('investor_bg')

	statics.express.post('/bg/upload', http.investorRequired, (rq, rs) =>
	{
		investor_bg(rq, rs, (err) =>
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

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
			.catch(err =>
			{
				if (err.code === 'file_not_found')
				{
					rs.sendStatus(404)
				}
				else
				{
					toss.err(err)
				}
			})
		})
	})


	statics.express.post('/upload/pic', authRequired,
		uploader(
			multer().single('pic'),
			statics.pic_model.update
		)
	)


	statics.express.post('/upload/profile_pic', http.adminOrInvestorRequired,
		uploader(
			multer().single('profile_pic'),
			statics.pic_model.updateProfile
		)
	)


	statics.express.post('/upload/post_pic', http.adminOrInvestorRequired,
		uploader(
			multer().single('post_pic'),
			statics.pic_model.uploadPostPic
		)
	)


	var UploadError = Err('upload_error', 'Upload error')


	function uploader (multipart_reader, setter)
	{
		return (rq, rs) =>
		{
			multipart_reader(rq, rs, (err) =>
			{
				if (err)
				{
					return toss.err(rs, UploadError(err))
				}

				var target_user_id = Number(rq.body.target_user_id)
				
				toss(rs, setter(rq.file, rq.user.id, target_user_id))
			})
		}
	}

	return statics
}

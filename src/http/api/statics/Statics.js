'use strict'

var Router = require('express').Router

var authRequired = require('../../auth-required')
var Err = require('../../../Err')
var toss = require('../../toss')

var fs = require('fs')

var mime = require('mime')
var multer = require('multer')

var lwip = require('lwip')
var round = require('lodash/round')

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

	var FileError = Err('wrong_file', 'Wrong file')

	var upload_pic = multer({
		fileFilter: function (req, file, done)
		{
			if (! file || ! file.mimetype)
			{
				done(FileError())
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

			validate_img(file)
			.then(() =>
			{
				return statics.user_model.picByUserId(user_id)
			})
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
			.catch(toss.err(rs))
		})
	})


	function validate_img (img)
	{
		return new Promise(rs =>
		{
			expect_file(img)
			validate_size(img)

			return rs()
		})
		.then(() =>
		{
			return validate_aspect(img)
		})
	}

	var SizeErr = Err('file_maximum_size_exceeded', 'File Maximum Size Exseeded')
	var max_size = 10 * 1024 * 1024

	function validate_size (img)
	{
		if (img.size > max_size)
		{
			throw SizeErr()
		}
	}

	var ReadErr = Err('wrong_file', 'Wrong File')

	function expect_file (file)
	{
		if (! file || file.size)
		{
			throw ReadErr()
		}
	}

	var aspect_width = 15
	var aspect_height = 11

	var GMError = Err('reading_file_error', 'Reading File Error')
	var WrongAspect = Err('wrong_aspect_ratio', 'Wrong Aspect Ratio')

	function validate_aspect (img)
	{
		return new Promise((rs, rj) =>
		{
			lwip.open(img.buffer, statics.fs.get_ext(img.mimetype), (err, image) =>
			{
				if (err)
				{
					return rj(GMError(err))
				}

				var aspect_ratio = round(aspect_width / aspect_height, 1)
				var real_ratio = round(image.width() / image.height(), 1)

				if ( aspect_ratio !== real_ratio )
				{
					return rj(WrongAspect())
				}

				return rs()
			})
		})
	}

	return statics
}

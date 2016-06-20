
var noop = require('lodash/noop')

var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var writeTo = require('fs').createWriteStream

var fs = require('fs')
var stat = promisify(fs.stat)
var unlink = promisify(fs.unlink)

var streamToPromise = require('stream-to-promise')

var Err = require('../../Err')

var lwip = require('lwip')
var round = require('lodash/round')

module.exports = function (rootpath, db)
{
	var static = {}
	var user_model = db.user
	var investor_model = db.investor
	var root_img = rootpath.partial('static/images')

	static.upload_pic = function (rq)
	{
		var file = rq.file
		var user_id = rq.user.id

		return validate_img(file)
		.then(() =>
		{
			return user_model.picByUserId(user_id)
		})
		.then(result =>
		{
			var pic = result.pic || ''

			if (pic)
			{
				return remove_file(pic)
			}
		})
		.then(() =>
		{
			return save_file(file)
		})
		.then(filename =>
		{
			return user_model.updatePic(
			{
				user_id: user_id,
				hash: filename
			})
		})
		.then(noop)
	}

	static.upload_profile_pic = function (rq)
	{
		var file = rq.file
		var user_id = rq.user.id

		return validate_img(file)
		.then(() =>
		{
			return investor_model.bgByUserId(user_id)
		})
		.then(result =>
		{
			var pic = result.profile_pic || ''

			if (pic)
			{
				return remove_file(pic)
			}
		})
		.then(() =>
		{
			return save_file(file)
		})
		.then(filename =>
		{
			return investor_model.update_profile_pic(
			{
				user_id: user_id,
				hash: filename
			})
		})
		.then(noop)
	}

	function remove_file (hash)
	{
		var t = tuple(hash)
		var path = tuple_to_filename(t)

		return stat(path)
		.then(() =>
		{
			return unlink(path)
		})
		.catch((err) =>
		{
			return
		})
	}

	var AlreadyExists = Err('file_already_exists', 'File already exists')
	var FileSavingErr = Err('file_saving_error', 'File Saving Error')

	function save_file (file)
	{
		var hash = uid()
		var filename = get_filename(hash, file.mimetype)

		var t = tuple(filename)

		var dirname = tuple_to_dir(t)
		var filenameFull = tuple_to_filename(t)

		return stat(filenameFull)
		.then(() =>
		{
			throw AlreadyExists()
		})
		.catch(err =>
		{
			if (err.code === 'ENOENT')
			{
				return mkdirp(dirname)
			}
			else
			{
				throw FileSavingErr(err)
			}
		})
		.then(() =>
		{
			writeTo(filenameFull).end(file.buffer)

			return streamToPromise(writeTo).then(() =>
			{
				return filename
			})
		})
	}

	function tuple (filename)
	{
		return [
			filename.charAt(0),
			filename.charAt(1),
			filename.slice(2)
		]
	}

	function get_ext (mime)
	{
		switch (mime)
		{
			case 'image/png' : return  'png'
			case 'image/jpeg': return 'jpeg'
			default: return 'jpeg'
		}
	}

	function get_filename (id, mime)
	{
		var ext = get_ext(mime)

		return `${id}.${ext}`
	}

	function tuple_to_dir (tuple)
	{
		return root_img(tuple.slice(0, -1))
	}

	function tuple_to_filename (tuple)
	{
		return root_img(tuple)
	}


	function validate_img (img)
	{
		return new Promise((rs, rj) =>
		{
			expect_file(img)
			.then(() =>
			{
				return validate_size(img)
			})
			// .then(() =>
			// {
			// 	return validate_aspect(img)
			// })
			.then(() =>
			{
				return rs()
			})
			.catch(err =>
			{
				return rj(err)
			})
		})
	}

	var SizeErr = Err('file_maximum_size_exceeded', 'File Maximum Size Exseeded')
	var max_size = 10 * 1024 * 1024

	function validate_size (img)
	{
		return new Promise(rs =>
		{
			if (img.size > max_size)
			{
				throw SizeErr()
			}

			return rs()
		})
	}

	var ReadErr = Err('wrong_file', 'Wrong File')

	function expect_file (file)
	{
		return new Promise(rs =>
		{
			if (! file || ! file.size)
			{
				throw ReadErr()
			}

			return rs()
		})
	}

	var aspect_width = 15
	var aspect_height = 11

	var GMError = Err('reading_file_error', 'Reading File Error')
	var WrongAspect = Err('wrong_aspect_ratio', 'Wrong Aspect Ratio')

	function validate_aspect (img)
	{
		return new Promise((rs, rj) =>
		{
			lwip.open(img.buffer, get_ext(img.mimetype), (err, image) =>
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

	return static
}

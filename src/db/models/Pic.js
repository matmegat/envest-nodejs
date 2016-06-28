
var noop = require('lodash/noop')

var Err = require('../../Err')

var lwip = require('lwip')
var round = require('lodash/round')

module.exports = function (db)
{
	var pic = {}
	var user_model = db.user
	var investor_model = db.investor
	var static_model = db.static

	var UpdateErr = Err('update_pic_error', 'Update Pic Error')

	pic.update = function (file, id)
	{
		var validation_data = {
			max_size: 10 * 1024 * 1024,
			ratio: {
				aspect_width: 1,
				aspect_height: 1
			}
		}

		return validate_img(file, validation_data)
		.then(() => 
		{
			return user_model.picById(id)
		})
		.then(result =>
		{
			var hash = result.pic

			return update_pic(hash, file)
		})
		.then(hash =>
		{
			return user_model.updatePic(
			{
				user_id: id,
				hash: hash
			})
			.catch(() =>
			{
				return static_model.remove(hash)
				.then(() =>
				{
					throw UpdateErr()
				})
			})
		})
		.then(noop)
	}

	pic.updateProfile = function (file, id)
	{
		var validation_data = {
			max_size: 10 * 1024 * 1024,
			ratio: {
				aspect_width: 15,
				aspect_height: 11
			}
		}

		return validate_img(file, validation_data)
		.then(() =>
		{
			return investor_model.profilePicById(id)
		})
		.then(result =>
		{
			var hash = result.profile_pic

			return update_pic(hash, file)
		})
		.then(hash =>
		{
			return investor_model.updateProfilePic(
			{
				user_id: id,
				hash: hash
			})
			.catch(() =>
			{
				return static_model.remove(hash)
				.then(() =>
				{
					throw UpdateErr()
				})
			})
		})
		.then(noop)
	}

	function update_pic (hash, file)
	{
		return static_model.remove(hash)
		.then(() =>
		{
			return static_model.store(file)
		})
	}


	function validate_img (img, settings)
	{
		var max_size = settings.max_size
		var ratio = settings.ratio

		return new Promise((rs, rj) =>
		{
			expect_file(img)
			.then(() =>
			{
				return validate_size(img, max_size)
			})
			.then(() =>
			{
				return validate_extension(img)
			})
			.then(() =>
			{
				return validate_aspect(img, ratio)
			})
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

	var SizeErr = Err('file_maximum_size_exceeded', 'File Maximum Size Exseeded')

	function validate_size (img, max_size)
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

	var GMError = Err('reading_file_error', 'Reading File Error')
	var WrongAspect = Err('wrong_aspect_ratio', 'Wrong Aspect Ratio')

	function validate_aspect (img, ratio)
	{
		return new Promise((rs, rj) =>
		{
			lwip.open(img.buffer, static_model.getExt(img.mimetype), (err, image) =>
			{
				if (err)
				{
					return rj(GMError(err))
				}

				var aspect_ratio = round(ratio.aspect_width / ratio.aspect_height, 1)
				var real_ratio = round(image.width() / image.height(), 1)

				if ( aspect_ratio !== real_ratio )
				{
					return rj(WrongAspect())
				}

				return rs()
			})
		})
	}

	var WrongExtension = Err('wrong_file_ext', 'Wrong File Extension')
	function validate_extension (img)
	{
		if (! img || ! img.mimetype)
		{
			throw WrongExtension()
		}

		var exts = ['image/png', 'image/jpg', 'image/jpeg']
		var result = exts.indexOf(img.mimetype)

		return new Promise(rs =>
		{
			if (result === -1)
			{
				throw WrongExtension()
			}

			return rs()
		})
	}

	return pic
}

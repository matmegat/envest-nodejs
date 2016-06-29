
var noop = require('lodash/noop')

var Err = require('../../Err')

var mime = require('mime')

var lwip = require('lwip')
var round = require('lodash/round')

module.exports = function (db)
{
	var pic = {}
	var user_model = db.user
	var investor_model = db.investor
	var static_model = db.static

	var UpdateErr = Err('update_pic_error', 'Update Pic Error')

	/* update User `pic` */
	pic.update = update_on_model(
		user_model.picById,
		user_model.updatePic,
	{
		max_size: 10 * 1024 * 1024,
		ratio: {
			aspect_width:  1,
			aspect_height: 1
		}
	})

	/* update Investor `profile_pic` */
	pic.updateProfile = update_on_model(
		investor_model.profilePicById,
		investor_model.updateProfilePic,
	{
		max_size: 10 * 1024 * 1024,
		ratio: {
			aspect_width:  15,
			aspect_height: 11
		}
	})

	return pic

	function update_on_model (getter, setter, validations)
	{
		return (file, id) =>
		{
			var new_pic
			var old_pic

			return validate_img(file, validations)
			.then(() =>
			{
				return static_model.store(file)
			})
			.then(hash =>
			{
				new_pic = hash

				return getter(id)
			})
			.then(result =>
			{
				old_pic = result.profile_pic
			})
			.then(() =>
			{
				return setter(
				{
					user_id: id,
					hash: new_pic
				})
				.catch(() =>
				{
					return static_model.remove(new_pic)
					.then(() =>
					{
						throw UpdateErr()
					})
				})
			})
			.then(() =>
			{
				return static_model.remove(old_pic)
			})
			.then(noop)
		}
	}
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
			return validate_mime(img)
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

var LwipError = Err('reading_file_error', 'Reading File Error')
var WrongAspect = Err('wrong_aspect_ratio', 'Wrong Aspect Ratio')

function validate_aspect (img, ratio)
{
	return new Promise((rs, rj) =>
	{
		lwip.open(img.buffer,
			mime.extension(img.mimetype),
			(err, image) =>
		{
			if (err)
			{
				return rj(LwipError(err))
			}

			var aspect_ratio =
				round(ratio.aspect_width / ratio.aspect_height, 1)
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
function validate_mime (img)
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

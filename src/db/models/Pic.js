
var Err = require('../../Err')

var mime = require('mime')

var validate = require('../validate')
var validateId = require('../../id').validate

var lwip = require('lwip')
var round = require('lodash/round')

module.exports = function (db)
{
	var pic = {}

	var user     = db.user
	var investor = db.investor

	var Emitter = db.notifications.Emitter

	var emits =
	{
		PicUpdated: Emitter('pic_updated'),
		ProfilePicUpdated: Emitter('profile_pic_updated')
	}

	/* update User `pic` */
	pic.update = update_on_model(
		user.picById,
		user.updatePic,
		emits.PicUpdated,
	{
		max_size: 10 * 1024 * 1024,
		ratio: {
			aspect_width:  1,
			aspect_height: 1
		}
	})

	/* update Investor `profile_pic` */
	pic.updateProfile = update_on_model(
		investor.profilePicById,
		investor.updateProfilePic,
		emits.ProfilePicUpdated,
	{
		max_size: 10 * 1024 * 1024,
		ratio: {
			aspect_width:  15,
			aspect_height: 11
		}
	})

	/* upload Investor's `post_pic` */
	pic.uploadPostPic = upload({
		max_size: 10 * 1024 * 1024,
		ratio: {
			aspect_width: 2,
			aspect_height: 1.1
		}
	})

	var static = db.static
	var UpdateErr = Err('update_pic_error', 'Update Pic Error')
	var WrongID = Err('wrong_id', 'Wrong ID')

	function update_on_model (getter, setter, emitter, validations)
	{
		return (file, id, target_user_id) =>
		{
			var new_pic
			var old_pic

			return Promise.resolve()
			.then(() =>
			{
				if (target_user_id)
				{
					var validate_id = validateId(WrongID)

					validate_id(target_user_id)

					return ensure_can_upload(id, target_user_id)
					.then(mode =>
					{
						if (mode == 'mode:admin')
						{
							id = target_user_id
						}

						return db.investor.all.ensure(id)
					})
				}
			})
			.then(() =>
			{
				return validate_img(file, validations)
			})
			.then(() =>
			{
				return static.store(file)
			})
			.then(hash =>
			{
				/* side effect */
				new_pic = hash

				return getter(id)
			})
			.then(result_pic =>
			{
				/* side effect */
				old_pic = result_pic
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
					return static.remove(new_pic)
					.then(() =>
					{
						throw UpdateErr()
					})
				})
			})
			.then(() =>
			{
				return static.remove(old_pic)
			})
			.then(() =>
			{
				emitter(id, { user: [ ':user-id', id ] })
			})
			.then(() =>
			{
				return {
					hash: new_pic
				}
			})
		}
	}

	function upload (validations)
	{
		return (file) =>
		{
			return validate_img(file, validations)
			.then(() =>
			{
				return static.store(file)
			})
			.then(hash =>
			{
				return {
					hash: hash
				}
			})
		}
	}

	var AdminOrOwnerRequired =
		Err('admin_or_owner_required', 'Admin Or Investor-Owner Required')

	function ensure_can_upload(whom_id, target_user_id)
	{
		return Promise.all([ db.admin.is(whom_id), db.investor.all.is(whom_id) ])
		.then(so =>
		{
			var is_admin    = so[0]
			var is_investor = so[1]

			if (is_admin)
			{
				return 'mode:admin'
			}
			else if (is_investor)
			{
				if (! (whom_id === target_user_id))
				{
					throw AdminOrOwnerRequired()
				}
			}
			else
			{
				throw AdminOrOwnerRequired()
			}
		})
	}

	return pic
}

function validate_img (img, settings)
{
	var max_size = settings.max_size
	var ratio    = settings.ratio

	return expect_file(img)
	.then(() =>
	{
		if (max_size)
		{
			return validate_size(img, max_size)
		}
	})
	.then(() =>
	{
		return validate_mime(img)
	})
	.then(() =>
	{
		if (ratio)
		{
			return validate_aspect(img, ratio)
		}
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

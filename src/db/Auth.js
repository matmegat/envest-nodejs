
var clone = require('lodash/clone')

var Err  = require('../Err')
var EmailAlreadyExists = Err('email_already_use', 'Email already in use')
var WrongLogin = Err('wrong_login_data', 'Wrong email or password')

var pick = require('lodash/pick')
var noop = require('lodash/noop')

module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var user = db.user

	auth.register = function (userdata)
	{
		userdata = clone(userdata)

		return validate_register(userdata)
		.then(() =>
		{
			return generate_salt()
		})
		.then(salt =>
		{
			return encrypt_pass(userdata.password, salt)
			.then(encrypted_pass =>
			{
				userdata.password = encrypted_pass
				userdata.salt     = salt

				return generate_code()
				.then(code =>
				{
					userdata.code = code

					return user.create(userdata)
				})
			})
		})
		.catch(Err.fromDb('email_confirms_new_email_unique', EmailAlreadyExists))
	}

	auth.login = function (email, password)
	{
		return validate_login(email, password)
		.then(() =>
		{
			return user.byEmail(email)
		})
		.then(Err.nullish(WrongLogin))
		.then(user_data =>
		{
			return compare_passwords(
				user_data.password,
				password,
				user_data.salt
			)
			.then(Err.falsy(WrongLogin))
			.then(() =>
			{
				return pick(user_data,
				[
					'id',
					'full_name',
					'email'
				])
			})
		})
	}


	var WrongConfirmCode = Err('wrong_confirm', 'Wrong confirm code')

	auth.emailConfirm = function (code)
	{
		return user.newEmailByCode(code)
		.then(Err.nullish(WrongConfirmCode))
		.then(email_confirms =>
		{
			return user.byConfirmedEmail(email_confirms.new_email)
			.then(user_data =>
			{
				if (user_data)
				{
					throw EmailAlreadyExists()
				}
				else
				{
					return user.emailConfirm(
						email_confirms.user_id,
						email_confirms.new_email
					)
				}
			})
		})
		.then(noop)
	}

	return auth
}


// 2 chars per 1 password  char
var salt_size     = 16
var code_size     = 16
var password_size = 36
var iterations    = 50000

var promisify = require('promisify-node')

var crypto = require('crypto')
var genHash = promisify(crypto.pbkdf2)

var method = require('lodash/method')
var hex = method('toString', 'hex')

var gen_rand_str = require('../genRandStr')

function generate_salt ()
{
	return gen_rand_str(salt_size)
}

function generate_code ()
{
	return gen_rand_str(code_size)
}

function encrypt_pass (password, salt)
{
	return hash(password, '')
	.then(pass_hash =>
	{
		return hash(pass_hash, salt)
	})
}

function hash (password, salt)
{
	return genHash(password, salt, iterations, password_size, 'sha512')
	.then(hex)
}

function compare_passwords (db_pass, form_pass, salt)
{
	return encrypt_pass(form_pass, salt)
	.then(encrypted_pass =>
	{
		return encrypted_pass === db_pass
	})
}


/* validations */
function validate_register (credentials)
{
	return new Promise(rs =>
	{
		validate_fullname(credentials.full_name)
		validate_password(credentials.password)
		validate_email(credentials.email)

		return rs()
	})
}

function validate_login (email, password)
{
	return new Promise(rs =>
	{
		validate_password(password)
		validate_email(email)

		return rs()
	})
}


var Err = require('../Err')

var FieldRequired = Err('field_required', 'Field is required')

function validate_required (field, name)
{
	if (field == null)
	{
		throw FieldRequired({ field: name })
	}
}


var XRegExp = require('xregexp')
var WrongFullName = Err('wrong_full_name_format', 'Wrong full name format')

function validate_fullname (full_name)
{
	validate_required(full_name, 'full_name')

	/*
	   Two words minimum, separated by space.
	   Any alphabet letters,
	   dashes, dots and spaces (not more than one successively).

	   Should begin with a letter and end with a letter or dot.
	*/
	var re = XRegExp.build(`^ {{word}} (\\s {{word}})+ \\.? $`,
	{
		word: XRegExp(`\\pL+ ([. ' -] \\pL+)*`, 'x')
	},
	'x')

	if (! re.test(full_name))
	{
		throw WrongFullName()
	}
}


var WrongEmail = Err('wrong_email_format', 'Wrong email format')

function validate_email (email)
{
	validate_required(email, 'email')

	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw WrongEmail()
	}
}

var TooShortPassword = Err('too_short_password', 'Password is too short')
var TooLongPassword  = Err('too_long_password', 'Password is too long')

function validate_password (password)
{
	validate_required(password, 'password')

	if (password.length < 6)
	{
		throw TooShortPassword()
	}
	if (password.length > 100)
	{
		throw TooLongPassword()
	}
}

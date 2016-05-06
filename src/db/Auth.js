
module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var user = db.user

	auth.register = function (userdata)
	{
		return validate_register(userdata)
		.then(() =>
		{
			return generate_salt()
		})
		.then(salt =>
		{
			return encrypt_pass(userdata.password, salt)
		})
		.then(obj =>
		{
			userdata.password = obj.encrypted_pass
			userdata.salt = obj.salt

			return user.create(userdata)
		})
	}

	auth.login = function (email, password)
	{
		return validate_login(email, password)
		.then(() =>
		{
			return user.byEmail(email)
		})
		.then(user =>
		{
			if (user)
			{
				return compare_passwords(user.password, password, user.salt)
				.then(result =>
				{
					if (result)
					{
						delete user.password
						delete user.salt

						return {
							status: true,
							user: user
						}
					}
					else
					{
						return {
							status: false,
							message: 'Incorrect password.'
						}
					}
				})
			}
			else
			{
				return {
					status: false,
					message: 'Incorrect email.'
				}
			}
		})
	}

	return auth
}


// DB salt size = 8 chars (16 bytes), DB password size = 18 chars (36 bytes)
var salt_size     = 16 / 2
var password_size = 36 / 2
var iterations    = 100000

var promisify = require('promisify-node')

var crypto = require('crypto')
var randomBytes = promisify(crypto.randomBytes)
var genHash = promisify(crypto.pbkdf2)

var method = require('lodash/method')
var hex = method('toString', 'hex')

function generate_salt ()
{
	return randomBytes(salt_size)
	.then(hex)
}

function encrypt_pass (password, salt)
{
	return hash(password, '', password_size)
	.then(pass_hash =>
	{
		return hash(pass_hash, salt, password_size)
	})
	.then(str =>
	{
		return {
			encrypted_pass: str,
			salt: salt
		}
	})
}

function hash (password, salt)
{
	return genHash(password, salt, iterations, password_size, 'sha512')
	.then(hex)
}

function compare_passwords (dbPass, formPass, salt)
{
	return encrypt_pass(formPass, salt)
	.then(result =>
	{
		return result.encrypted_pass === dbPass
	})
}


/* validations */
function validate_register (credentials)
{
	return new Promise((rs, rj) =>
	{
		validate_required(credentials.full_name, 'full_name')
		validate_required(credentials.email,     'email')
		validate_password(credentials.password)

		validate_email(credentials.email)

		return rs()
	})
}

function validate_login (email, password)
{
	return new Promise((rs, rj) =>
	{
		validate_required(email, 'email')
		validate_password(password)

		validate_email(email)

		return rs()
	})
}


var format = require('util').format
var Err = require('../Err')

var FieldRequired = Err('field_required', 'Field is required')

function validate_required (field, name)
{
	if (field == null)
	{
		throw FieldRequired({ field: name })
	}
}

var WrongEmail    = Err('wrong_email_format', 'Wrong email format')

function validate_email (email)
{
	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw WrongEmail()
	}
}

var TooShortPassword = Err('too_short_password', 'Password is too short, 6 symbols at least required')
var TooLongPassword  = Err('too_short_password', 'Password is too short, 6 symbols at least required')

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


module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var user = db.user

	auth.register = function (userdata)
	{
		return validate(user)
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

			user.create(userdata)
		})
	}

	auth.login = function (username, password)
	{
		return user.byEmail(username)
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

function validate (credentials)
{
	var emailRe = /@/

	return new Promise((rs, rj) =>
	{
		validate_required(credentials, 'first_name')
		validate_required(credentials, 'last_name')
		validate_required(credentials, 'email')
		validate_required(credentials, 'password')

		if (! emailRe.test(credentials.email))
		{
			return rj(new Error('Invalid email'))
		}

		return rs()
	})
}
var format = require('util').format

function validate_required (credentials, field)
{
	if (! (field in credentials))
	{
		throw new Error(format('field `%s` is required', field))
	}
}

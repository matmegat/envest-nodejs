
module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var user = db.user

	auth.register = function (userdata)
	{
		return validate(userdata)
		.then(() =>
		{
			return generate_salt(salt_size)
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
		.then(user_id =>
		{
			return generate_code(code_size)
			.then(code =>
			{
				var new_email_data =
				{
					user_id:   user_id[0],
					new_email: userdata.email,
					code:      code
				}

				return user.newEmailCreate(new_email_data)
			})
		})
	}

	auth.login = function (username, password)
	{
		return user.byEmail(username)
		.then(user_data =>
		{
			if (user_data)
			{
				return compare_passwords(user_data.password, password, user_data.salt)
				.then(result =>
				{
					if (result)
					{
						delete user_data.password
						delete user_data.salt

						return {
							status: true,
							user: user_data
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

	auth.emailConfirm = function (code)
	{
		return user.newEmailByCode(code)
		.then(email_confirms =>
		{
			if (email_confirms)
			{
				return user.byConfimedEmail(email_confirms.new_email)
				.then(user_data =>
				{
					if(user_data)
					{
						return {
							status: false,
							message: 'This email is already used.'
						}
					}
					else
					{
						user.emailConfirm(email_confirms)
						return {
							status: true,
							message: 'Email confirmation.'
						}
					}
				})
			}
			else
			{
				return {
					status: false,
					message: 'Not correct confirmation code.'
				}
			}
		})
	}

	return auth
}


// DB salt size = 8 chars (16 bytes), DB password size = 18 chars (36 bytes)
var salt_size     = 16 / 2
var code_size     = 16 / 2
var password_size = 36 / 2
var iterations    = 100000

var promisify = require('promisify-node')

var crypto = require('crypto')
var genHash = promisify(crypto.pbkdf2)

var method = require('lodash/method')
var hex = method('toString', 'hex')

var gen_rand_str = require('../GenRandStr')

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
		validate_required(credentials, 'full_name')
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

var clone = require('lodash/clone')

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
		})
		.then(obj =>
		{
			userdata.password = obj.encrypted_pass
			userdata.salt = obj.salt

			return generate_code()
			.then(code =>
			{
				userdata.code = code

				return user.create(userdata)
			})
		})
	}

	auth.login = function (email, password)
	{
		return validate_login(email, password)
		.then(() =>
		{
			return user.byEmail(email)
		})
		.then(user_data =>
		{
			if (user_data)
			{
				return compare_passwords(
				user_data.password,
				password,
				user_data.salt)
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
				return user.byConfirmedEmail(email_confirms.new_email)
				.then(user_data =>
				{
					if (user_data)
					{
						return {
							status: false,
							message: 'This email is already used.'
						}

					}
					else
					{
						user.emailConfirm(
							email_confirms.user_id,
							email_confirms.new_email)

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

function validate_register (credentials)
{
	return new Promise(rs =>
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
	return new Promise(rs =>
	{
		validate_required(email, 'email')
		validate_password(password)

		validate_email(email)

		return rs()
	})
}


var format = require('util').format

function validate_required (field, name)
{
	if (field === null)
	{
		throw new Error(format('field `%s` is required', name))
	}
}

function validate_email (email)
{
	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw new Error('invalid email')
	}
}

function validate_password (password)
{
	validate_required(password, 'password')

	if (password.length < 6)
	{
		throw new Error('password is too short')
	}
	if (password.length > 100)
	{
		throw new Error('password is too long')
	}
}

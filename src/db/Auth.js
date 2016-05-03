
module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var knex = db.knex

	auth.users = knex('users')
	auth.email_confirms = knex('email_confirms')

	auth.register = function (user)
	{
		return validate(user)
		.then(() =>
		{
			return generate_salt()
		})
		.then(salt =>
		{
			return encrypt_pass(user.password, salt)
		})
		.then(obj =>
		{
			return auth.users
			.insert({
				first_name: user.first_name,
				last_name: user.last_name,
				email: user.email,
				password: obj.encrypted_pass,
				salt: obj.salt
			}, 'id')
		})
		.catch((error) =>
		{
			throw error
		})
	}

	auth.login = function (username, password)
	{
		return auth.byEmail(username)
		.then(user =>
		{
			if (user)
			{
				return auth.comparePasswords(user.password, password, user.salt)
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

	auth.byEmail = function (email)
	{
		return auth.users
		.where('email', email)
		.first()
	}

	auth.byId = function (id)
	{
		return auth.users
		.where('id', id)
		.first()
	}

	auth.comparePasswords = function (dbPass, formPass, salt)
	{
		return encrypt_pass(formPass, salt)
		.then(result =>
		{
			return result.encrypted_pass === dbPass
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

function hash (password, salt)
{
	return genHash(password, salt, iterations, password_size, 'sha512')
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

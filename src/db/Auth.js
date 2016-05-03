
module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var user = db.user

	auth.register = function (userdata)
	{
		return generate_salt()
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
		.catch(err =>
		{
			console.log(err)
		})
	}

	auth.login = function (username, password)
	{
		return user.byEmail(username)
		.then(user =>
		{
			if (user)
			{
				return auth.comparePasswords(user.password, password, user.salt)
				.then(result =>
				{
					if (result)
					{
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
					message: 'Incorrect username.'
				}
			}
		})
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

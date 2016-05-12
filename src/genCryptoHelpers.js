
var crypto = require('crypto')
var promisify = require('promisify-node')

var randomBytes = promisify(crypto.randomBytes)
var genHash = promisify(crypto.pbkdf2)

var method = require('lodash/method')
var hex = method('toString', 'hex')

// DB salt size = 8 chars (16 bytes), DB password size = 18 chars (36 bytes)
var salt_size     = 16 / 2
var code_size     = 16 / 2
var password_size = 36 / 2
var iterations    = 100000

var helpers = {}

function gen_rand_str (length)
{
	return randomBytes(length)
	.then(hex)
}

function hash (password, salt)
{
	return genHash(password, salt, iterations, password_size, 'sha512')
	.then(hex)
}

var helpers =
{
	generate_salt: function ()
	{
		return gen_rand_str(salt_size)
	},
	generate_code: function ()
	{
		return gen_rand_str(code_size)
	},
	encrypt_pass: function (password, salt)
	{
		return hash(password, '')
		.then(pass_hash =>
		{
			return hash(pass_hash, salt)
		})
	},
	compare_passwords: function (db_pass, form_pass, salt)
	{
		return helpers.encrypt_pass(form_pass, salt)
		.then(encrypted_pass =>
		{
			return encrypted_pass === db_pass
		})
	}
}

module.exports = helpers

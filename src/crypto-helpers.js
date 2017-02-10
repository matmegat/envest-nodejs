
var crypto = require('crypto')
var promisify = require('promisify-node')

var randomBytes = promisify(crypto.randomBytes)
var genHash = promisify(crypto.pbkdf2)

var method = require('lodash/method')
var hex = method('toString', 'hex')

// DB salt size = 8 chars (16 bytes), DB password size = 18 chars (36 bytes)
var salt_size     = 16
var code_size     = 6
var password_size = 36
var iterations    = 48329

var helpers = module.exports = {}

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


helpers.generate_salt = function generate_salt ()
{
	return gen_rand_str(salt_size)
}

helpers.generate_code = function generate_code ()
{
	var chars = '0123456789abcdefghijklmnopqrstuvwxyz'

	return new Promise(function (rs)
	{
		var chars_length = chars.length
		var random_bytes = crypto.randomBytes(code_size)

		var result = new Array(code_size)

		var cursor = 0
		for (var i = 0; i < code_size; i ++)
		{
			cursor += random_bytes[i]
			result[i] = chars[cursor % chars_length]
		}

		rs(result.join(''))
	})
}

var encrypt_pass = helpers.encrypt_pass = function encrypt_pass (password, salt)
{
	return hash(password, '')
	.then(pass_hash =>
	{
		return hash(pass_hash, salt)
	})
}

helpers.compare_passwords = function compare_passwords (pass, form_pass, salt)
{
	return encrypt_pass(form_pass, salt)
	.then(encrypted_pass =>
	{
		return encrypted_pass === pass
	})
}


var crypto    = require('crypto')
var promisify = require('promisify-node')
var method    = require('lodash/method')

var randomBytes = promisify(crypto.randomBytes)
var genHash = promisify(crypto.pbkdf2)

var hex = method('toString', 'hex')

// DB salt size = 8 chars (16 bytes), DB password size = 18 chars (36 bytes)
var salt_size     = 16 / 2
var code_size     = 16 / 2
var password_size = 36 / 2
var iterations    = 100000

module.exports = function genRandStr ()
{
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

	function compare_passwords (db_pass, form_pass, salt)
	{
		return encrypt_pass(form_pass, salt)
		.then(encrypted_pass =>
		{
			return encrypted_pass === db_pass
		})
	}

	return {
		generate_salt: generate_salt,
		generate_code: generate_code,
		encrypt_pass: encrypt_pass,
		compare_passwords: compare_passwords
	}
}

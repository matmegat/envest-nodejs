const Router = require('express').Router
const Crypto = require('crypto')

module.exports = function Auth (db)
{
	var auth = {}

	auth.express = Router()

	auth.express.post('/register', (req, res) =>
	{
		var data = req.body

		var first_name = data.first_name
		var last_name = data.last_name
		var email = data.email
		var salt = generate_salt(8)
		var password = encrypt_pass(data.password, salt, 18)

		db.knex('users')
		.insert({
			first_name: first_name,
			last_name: last_name,
			email: email,
			password: password,
			salt: salt
		})
		.then(() =>
		{
			res.sendStatus(200)
		})
		.catch((error) =>
		{
			res.status(500).send(error)
		})
	})

	auth.express.post('/login', (req, res) =>
	{
		res.json(req.body)
	})

	return auth
}

function generate_salt (size)
{
	return Crypto
			.randomBytes(size)
			.toString('hex')
}

function hash (password, salt, size)
{
	return Crypto
			.pbkdf2Sync(password, salt, 100000, size, 'sha512')
			.toString('hex')
}

function encrypt_pass (password, salt, size)
{
	var pass_hash = hash(password, '', size)

	return hash(pass_hash, salt, size)
}

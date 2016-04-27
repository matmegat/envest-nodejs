
const crypto = require('crypto')

const promisify = require('promisify-node')

const random_bytes = promisify(crypto.randomBytes)
const create_hash = promisify(crypto.pbkdf2)

module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var knex = db.knex

	auth.users = knex('users')
	auth.email_confirms = knex('email_confirms')

	auth.register = function (user)
	{
		return generate_salt()
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
			})
		})
	}

	auth.select_user = function (email)
	{
		return auth.users
		.where('email', email)
		.first()
		.then(user =>
		{
			return user
		})
	}

	auth.get_by_id = function (id)
	{
		return auth.users
		.where('id', id)
		.first()
		.then(user =>
		{
			return user
		})
	}

	auth.helpers =
	{
		generate_salt: generate_salt,
		hash: hash,
		encrypt_pass: encrypt_pass
	}

	return auth
}

// DB salt size = 16(8 bytes), DB password size = 36(18 bytes)
const SALT_SIZE = 8
const PASSWORD_SIZE = 18

function generate_salt ()
{
	var size = SALT_SIZE

	return random_bytes(size)
	.then(buf =>
	{
		return buf.toString('hex')
	})
	.catch(error =>
	{
		console.log('Generate salt error:' + error)
	})
}

function hash (password, salt)
{
	var size = PASSWORD_SIZE

	return create_hash(password, salt, 100000, size, 'sha512')
	.then(buf =>
	{
		return buf.toString('hex')
	})
	.catch(error =>
	{
		console.log('Hash error:' + error)
	})
}

function encrypt_pass (password, salt)
{
	var size = PASSWORD_SIZE

	return hash(password, '', size)
	.then(pass_hash =>
	{
		return hash(pass_hash, salt, size)
	})
	.then(buff =>
	{
		return {
			encrypted_pass: buff,
			salt: salt
		}
	})
	.catch(error =>
	{
		console.log('Encrypt error:' + error)
	})
}

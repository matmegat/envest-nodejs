const crypto = require('crypto')

const promisify = require('promisify-node')

const random_bytes = promisify(crypto.randomBytes)
const create_hash = promisify(crypto.pbkdf2)

module.exports = function Auth (db)
{
	var auth = {}

	// DB salt size = 16(8 bytes), DB password size = 36(18 bytes)
	const SALT_SIZE = 8
	const PASSWORD_SIZE = 18

	auth.db = db

	var knex = db.knex

	auth.users = knex('users')
	auth.email_confirms = knex('email_confirms')

	auth.register = function(first_name, last_name, email, password)
	{
		return generate_salt(SALT_SIZE)
		.then(salt => {
			return encrypt_pass(password, salt, PASSWORD_SIZE)
		})
		.then(obj => {
			return auth.users
			.insert({
				first_name: first_name,
				last_name: last_name,
				email: email,
				password: obj.encrypted_pass,
				salt: obj.salt
			})
		})
		.catch(error => {
			console.log('Insert error' + error)
		})
	}

	auth.select_user = function(email)
	{
		return auth.users
		.select('password', 'salt')
		.where(
		{
			email: email
		})
		.then((user) => {
			return user
		})
	}

	return auth
}

function generate_salt (size)
{
	return random_bytes(size)
	.then(buf => {
		return buf.toString('hex')
	})
	.catch(error => {
		console.log('Generate salt error:' + error)
	})
}

function hash (password, salt, size)
{
	return create_hash(password, salt, 100000, size, 'sha512')
	.then(buf => {
		return buf.toString('hex')
	})
	.catch(error => {
		console.log('Hash error:' + error)
	})
}

function encrypt_pass (password, salt, size)
{
	return hash(password, '', size)
	.then(pass_hash => {
		return hash(pass_hash, salt, size)
	})
	.then(buff => {
		return {
			encrypted_pass: buff,
			salt: salt
		}
	})
	.catch(error => {
		console.log('Encrypt error' + error)
	})
}
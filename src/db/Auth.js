
var clone = require('lodash/clone')

var Err  = require('../Err')
var EmailAlreadyExists = Err('email_already_exists', 'User with this email already exists')

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
			.then(encrypted_pass =>
			{
				userdata.password = encrypted_pass
				userdata.salt     = salt

				return generate_code()
				.then(code =>
				{
					userdata.code = code

					return user.create(userdata)
				})
			})
		})
		.catch(Err.fromDb('email_confirms_new_email_unique', EmailAlreadyExists))
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
					user_data.salt
				)
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
	return hash(password, '')
	.then(pass_hash =>
	{
		return hash(pass_hash, salt)
	})
}

function hash (password, salt)
{
	return genHash(password, salt, iterations, password_size, 'sha512')
	.then(hex)
}

function compare_passwords (db_pass, form_pass, salt)
{
	return encrypt_pass(form_pass, salt)
	.then(encrypted_pass =>
	{
		return encrypted_pass === db_pass
	})
}


/* validations */
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
var Err = require('../Err')

var FieldRequired = Err('field_required', 'Field is required')

function validate_required (field, name)
{
	// eslint-disable-next-line eqeqeq
	if (field == null)
	{
		throw FieldRequired({ field: name })
	}
}

var WrongEmail    = Err('wrong_email_format', 'Wrong email format')

function validate_email (email)
{
	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw WrongEmail()
	}
}

var TooShortPassword = Err('too_short_password', 'Password is too short, 6 symbols at least required')
var TooLongPassword  = Err('too_short_password', 'Password is too short, 6 symbols at least required')

function validate_password (password)
{
	validate_required(password, 'password')

	if (password.length < 6)
	{
		throw TooShortPassword()
	}
	if (password.length > 100)
	{
		throw TooLongPassword()
	}
}

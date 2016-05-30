
var expect = require('chai').expect

var clone = require('lodash/clone')

var Err = require('../../Err')
var WrongLogin = Err('wrong_login_data', 'Wrong email or password')

var pick = require('lodash/pick')
var noop = require('lodash/noop')

var cr_helpers = require('../../crypto-helpers')

var generate_salt = cr_helpers.generate_salt
var encrypt_pass  = cr_helpers.encrypt_pass
var compare_passwords = cr_helpers.compare_passwords

module.exports = function Auth (db)
{
	var auth = {}

	expect(db, 'Auth depends on User').property('user')
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

				return user.create(userdata)
			})
		})
	}

	auth.login = function (email, password)
	{
		email = email.toLowerCase()

		return validate_login(email, password)
		.then(() =>
		{
			return user.byEmail(email)
		})
		.then(Err.nullish(WrongLogin))
		.then(user_data =>
		{
			if (! user_data.password)
			{
				throw WrongLogin()
			}
			return user_data
		})
		.then(user_data =>
		{
			return compare_passwords(
				user_data.password,
				password,
				user_data.salt
			)
			.then(Err.falsy(WrongLogin))
			.then(() =>
			{
				return pick(user_data,
				[
					'id',
					'first_name',
					'last_name',
					'email',
					'pic'
				])
			})
		})
	}

	var WrongConfirmCode = Err('wrong_confirm', 'Wrong confirm code')

	auth.emailConfirm = function (code)
	{
		return user.newEmailByCode(code)
		.then(Err.nullish(WrongConfirmCode))
		.then(email_confirms =>
		{
			return user.emailConfirm(
				email_confirms.user_id,
				email_confirms.new_email
			)
		})
		.then(noop)
	}


	auth.changeEmail = function (user_id, new_email)
	{
		return validate_change_email(new_email)
		.then(() =>
		{
			return user.newEmailUpdate({
				user_id: user_id,
				new_email: new_email
			})
		})
		.then(noop)
	}


	auth.validateLogin = function (email, password)
	{
		email = email.toLowerCase()

		return validate_login(email, password)
	}

	return auth
}

/* validations */
function validate_register (credentials)
{
	return new Promise(rs =>
	{
		validate_firstname(credentials.first_name)
		validate_lastname(credentials.last_name)
		validate_password(credentials.password)
		validate_email(credentials.email)

		return rs()
	})
}

// eslint-disable-next-line id-length
function validate_change_email (email)
{
	return new Promise(rs =>
	{
		validate_email(email)

		return rs()
	})
}

function validate_login (email, password)
{
	return new Promise(rs =>
	{
		validate_password(password)
		validate_email(email)

		return rs()
	})
}


var validate = require('../validate')

var validate_required = validate.required

var validate_empty = validate.empty


var XRegExp = require('xregexp')

var WrongFirstName = Err('wrong_first_name_format', 'Wrong first name format')

function validate_firstname (first_name)
{
	validate_required(first_name, 'first_name')
	validate_empty(first_name, 'first_name')

	/*
	   Two words minimum, separated by space.
	   Any alphabet letters,
	   dashes, dots and spaces (not more than one successively).

	   Should begin with a letter and end with a letter or dot.
	*/
	var re = XRegExp.build(`^ {{word}} (\\s {{word}})? \\.? $`,
	{
		word: XRegExp(`\\pL+ ([. ' -] \\pL+)*`, 'x')
	},
	'x')

	if (! re.test(first_name))
	{
		throw WrongFirstName()
	}
}

var WrongLastName = Err('wrong_last_name_format', 'Wrong last name format')

function validate_lastname (last_name)
{
	validate_required(last_name, 'last_name')
	validate_empty(last_name, 'last_name')

	/*
	   Two words minimum, separated by space.
	   Any alphabet letters,
	   dashes, dots and spaces (not more than one successively).

	   Should begin with a letter and end with a letter or dot.
	*/
	var re = XRegExp.build(`^ {{word}} (\\s {{word}})? \\.? $`,
	{
		word: XRegExp(`\\pL+ ([. ' -] \\pL+)*`, 'x')
	},
	'x')

	if (! re.test(last_name))
	{
		throw WrongLastName()
	}
}


var WrongEmail = Err('wrong_email_format', 'Wrong email format')

function validate_email (email)
{
	validate_required(email, 'email')
	validate_empty(email, 'email')

	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw WrongEmail()
	}
}

var TooShortPassword = Err('too_short_password', 'Password is too short')
var TooLongPassword  = Err('too_long_password', 'Password is too long')

function validate_password (password)
{
	validate_required(password, 'password')
	validate_empty(password, 'password')

	if (password.length < 6)
	{
		throw TooShortPassword()
	}
	if (password.length > 100)
	{
		throw TooLongPassword()
	}
}

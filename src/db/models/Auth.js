
var expect = require('chai').expect

var Err = require('../../Err')
var WrongLogin = Err('wrong_login_data', 'Wrong email or password')

var pick = require('lodash/pick')
var noop = require('lodash/noop')

var cr_helpers = require('../../crypto-helpers')

var compare_passwords = cr_helpers.compare_passwords

module.exports = function Auth (db)
{
	var auth = {}

	expect(db, 'Auth depends on User').property('user')
	var user = db.user

	auth.register = function (userdata)
	{
		return validate_register(userdata)
		.then(() =>
		{
			return user.create(userdata)
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

	/* validations */
	function validate_register (credentials)
	{
		return new Promise(rs =>
		{
			validate_name(credentials.first_name, 'first_name')
			validate_name(credentials.last_name, 'last_name')
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
			user.password.validate(password)
			validate_email(email)

			return rs()
		})
	}


	var validate = require('../validate')

	var validate_required = validate.required

	var validate_empty = validate.empty

	var validate_length = validate.length


	var XRegExp = require('xregexp')

	var WrongName = Err('wrong_name_format', 'Wrong name format')

	var validateNameLength = validate_length(255)

	function validate_name (name, field_name)
	{
		validate_required(name, field_name)
		validate_empty(name, field_name)
		validateNameLength(name, field_name)

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

		if (! re.test(name))
		{
			throw WrongName()
		}
	}

	var WrongEmail = Err('wrong_email_format', 'Wrong email format')

	function validate_email (email)
	{
		validate_required(email, 'email')
		validate_empty(email, 'email')

		if (email.length > 254)
		{
			throw WrongEmail()
		}

		var emailRe = /@/

		if (! emailRe.test(email))
		{
			throw WrongEmail()
		}
	}

	return auth
}

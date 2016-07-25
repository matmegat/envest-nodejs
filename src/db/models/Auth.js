
var expect = require('chai').expect

var Err = require('../../Err')
var WrongLogin = Err('wrong_login_data', 'Wrong email or password')

var noop = require('lodash/noop')

var cr_helpers = require('../../crypto-helpers')

var compare_passwords = cr_helpers.compare_passwords

var knexed = require('../knexed')

module.exports = function Auth (db, subsc)
{
	var auth = {}

	expect(db, 'Auth depends on User').property('user')
	var user = db.user

	auth.register = knexed.transact(db.knex, (trx, userdata) =>
	{
		return validate_register(userdata)
		.then(() =>
		{
			return user.create(trx, userdata)
		})
		.then(function (id)
		{
			return user.newEmailUpdate(trx,
			{
				user_id: id,
				new_email: userdata.email
			})
		})
		.then((user_id) =>
		{
			return subsc.activate(user_id, 'trial', 30, trx)
		})
	})

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
				return user.infoById(user_data.id)
			})
		})
	}

	var WrongConfirmCode = Err('wrong_confirm', 'Wrong confirm code')

	auth.emailConfirm = function (code)
	{
		return user.newEmailByCode(code.toLowerCase())
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
			return user.newEmailUpdate(null,
			{
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

	var validate_name = validate.name
	var validate_email = validate.email

	return auth
}

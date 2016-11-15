
var expect = require('chai').expect

var Err = require('../../Err')
var WrongLogin = Err('wrong_login_data', 'Wrong email or password')

var noop = require('lodash/noop')
var extend = require('lodash/extend')

var cr_helpers = require('../../crypto-helpers')

var compare_passwords = cr_helpers.compare_passwords
var generate_code = cr_helpers.generate_code

var knexed = require('../knexed')

module.exports = function Auth (db, mailer)
{
	var auth = {}

	expect(db, 'Auth depends on User').property('user')
	var user = db.user

	auth.register = knexed.transact(db.knex, (trx, userdata) =>
	{
		return Promise.resolve()
		.then(() =>
		{
			return validate.register(userdata)
		})
		.then(() =>
		{
			return user.create(trx, userdata)
		})
		.then(id =>
		{
			return user.newEmailUpdate(trx,
			{
				user_id: id,
				new_email: userdata.email
			})
			.then(() =>
			{
				var substs =
				{
					email_title: [ 'Welcome to Netvest' ],
					first_name: [ userdata.first_name ],
				}

				return mailer.send('user_welcome', substs,
				{
					to: userdata.email,
					subject: 'Welcome to Netvest',
					html: `Hi, ${userdata.first_name} ${userdata.last_name}.` +
						`<br/><br/>` +
						`Welcome to Netvest.<br/>` +
						`Check our <a href="http://www.netvest.com">` +
						`website</a>, iOS and Android applications.`
				})
				.then(() => id, () => id)
			})
		})
	})

	auth.registerWithPass = knexed.transact(db.knex, (trx, data) =>
	{
		return Promise.resolve()
		.then(() =>
		{
			return validate.register(data)
		})
		.then(() => generate_code())
		.then(password =>
		{
			var user_data = extend({}, data,
			{
				password: password
			})

			return user.create(trx, user_data)
		})
		.then(user_id => user.byId(user_id, trx))
		.then(user => user.id)
	})

	auth.login = function (email, password, trx)
	{
		email = email.toLowerCase()

		return validate_login(email, password)
		.then(() =>
		{
			return user.byEmail(email, trx)
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
		return new Promise(rs =>
		{
			validate.string(code, 'code')
			validate.empty(code, 'code')

			return rs()
		})
		.then(() =>
		{
			return user.newEmailByCode(code.toLowerCase())
		})
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
	var validate_email = validate.email

	return auth
}

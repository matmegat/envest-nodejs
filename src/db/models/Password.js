
var knexed = require('../knexed')

var Err = require('../../Err')
var noop = require('lodash/noop')
var cr_helpers = require('../../crypto-helpers')

module.exports = function Password (db, user)
{
	var password = {}

	var knex = db.knex

	var one = db.helpers.one

	var generate_salt = cr_helpers.generate_salt
	var encrypt_pass  = cr_helpers.encrypt_pass
	var generate_code = cr_helpers.generate_code
	var compare_passwords = cr_helpers.compare_passwords

	password.reset_table = knexed(knex, 'pass_reset')

	password.create = function (user_id, new_pass, trx)
	{
		return validate_pass(new_pass)
		.then(() =>
		{
			return password.genHashSalt(new_pass)
			.then(data =>
			{
				return user.auth_local(trx)
				.insert(
				{
					user_id: user_id,
					password: data.password,
					salt: data.salt
				}, 'user_id')
				.then(one)
				.catch(err =>
				{
					if (err.constraint === 'pass_reset_pkey')
					{
						return user.auth_local(trx)
						.update(data, 'user_id')
						.where('user_id', user_id)
						.then(one)
					}
					else
					{
						throw err
					}
				})
				
			})
		})
	}

	password.genHashSalt = function (pass)
	{
		return generate_salt()
		.then(salt =>
		{
			return encrypt_pass(pass, salt)
			.then(hash =>
			{
				var data = 
				{
					password: hash,
					salt: salt
				}

				return data
			})
		})
	}

	var WrongPass = Err('wrong_pass', 'Wrong password')

	password.change = function (user_id, pass, new_pass)
	{
		return validate_pass(pass)
		.then(() =>
		{
			return user.auth_local()
			.where('user_id', user_id)
			.then(one)
			.then(user =>
			{
				return compare_passwords(user.password, pass, user.salt)
				.then(Err.falsy(WrongPass))
				.then(() =>
				{
					return password.create(user_id, new_pass)
				})
			})
		})
	}

	var EmailNotFound = Err('email_not_found', 'Email not found')

	password.reqReset = knexed.transact(knex, (trx, email, timestamp) =>
	{
		//add validate_emeil(email)
		return user.byEmail(email)
		.then(Err.nullish(EmailNotFound))
		.then(user =>
		{
			return generate_code()
			.then(code =>
			{
				var data =
				{
					user_id: user.id,
					code: code
				}

				if (timestamp === null)
				{
					data.timestamp = null
				}

				return password.reset_table(trx)
				.insert(data)
				.then(noop)
				.catch(err =>
				{
					if (err.constraint === 'pass_reset_pkey')
					{
						return password.reset_table()
						.update(
						{
							code: code,
							timestamp: knex.fn.now()
						})
						.where('user_id', user.id)
						.then(noop)
					}
					else
					{
						throw err
					}
				})
			})
		})
	})

	var ResetCodeNotFound = Err('reset_code_not_found', 'Reset code not found')
	var ExpiredCode = Err('expired_code', 'Expired code')

	var lifetime_code = 24 * 360000 // 24 hr

	password.reset = knexed.transact(knex, (trx, reset_code, new_pass) =>
	{
		return password.reset_table(trx)
		.where('code', reset_code)
		.then(Err.emptish(ResetCodeNotFound))
		.then(one)
		.then(data =>
		{
			var red_line = (new Date).getTime() - lifetime_code
			var сurrent_time = new Date(data.timestamp).getTime()

			if (сurrent_time > red_line || ! data.timestamp)
			{
				return password.create(data.user_id, new_pass, trx)
				.then(() =>
				{
					return password.reset_table(trx)
					.where('code', reset_code)
					.del()
					.then(noop)
				})
			}
			else
			{
				throw ExpiredCode()
			}
		})
	})

	var validate = require('../validate')

	var validate_required = validate.required
	var validate_empty = validate.empty

	var TooShortPassword = Err('too_short_password', 'Password is too short')
	var TooLongPassword  = Err('too_long_password', 'Password is too long')

	password.validate = function (password)
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

	function validate_pass (pass)
	{
		return new Promise(rs =>
		{
			password.validate(pass)
			return rs()
		})
	}

	return password
}

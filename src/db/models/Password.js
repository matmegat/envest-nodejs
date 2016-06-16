
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
	var generate_code  = cr_helpers.generate_code

	password.reset_table = knexed(knex, 'pass_reset')

	password.update = function (user_id, new_pass, trx)
	{
		return generate_salt()
		.then(salt =>
		{
			return encrypt_pass(new_pass, salt)
			.then(new_pass_hash =>
			{
				return user.auth_local(trx)
				.update({
					password: new_pass_hash,
					salt: salt
				})
				.where('user_id', user_id)
				.then(noop)
			})
		})
	}

	var WrongPass = Err('wrong_pass', 'Wrong password')

	password.change = function (user_id, pass, new_pass)
	{
		return user.auth_local()
		.where('user_id', user_id)
		.then(one)
		.then(user =>
		{
			return encrypt_pass(pass, user.salt)
			.then(pass_hash =>
			{
				if (pass_hash === user.password)
				{
					return password.update(user_id, new_pass)
				}
				else
				{
					WrongPass()
				}
			})
		})
	}

	var EmailNotFound = Err('email_not_found', 'Email not found')

	password.reqReset = knexed.transact(knex, (trx, email, timestamp) =>
	{
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
				return password.update(data.user_id, new_pass, trx)
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

	return password
}

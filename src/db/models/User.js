
var knexed = require('../knexed')

var generate_code = require('../../crypto-helpers').generate_code
var extend = require('lodash/extend')

var Err = require('../../Err')
var Groups = require('./Groups')
var NotFound = Err('user_not_found', 'User not found')
var EmailAlreadyExists = Err('email_already_use', 'Email already in use')
var WrongUserId = Err('wrong_user_id', 'Wrong user id')
var UserDoesNotExist = Err('user_not_exist', 'User does not exist')

module.exports = function User (db)
{
	var user = {}

	var knex = db.knex

	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	user.users_table    = knexed(knex, 'users')
	user.email_confirms = knexed(knex, 'email_confirms')
	user.auth_facebook  = knexed(knex, 'auth_facebook')
	user.auth_local     = knexed(knex, 'auth_local')

	user.NotFound = NotFound

	user.groups = Groups(db, user)

	user.ensure = function (id, trx)
	{
		return user.byId(id, trx)
		.then(Err.nullish(UserDoesNotExist))
	}

	user.byId = function (id, trx)
	{
		return validate_id(id)
		.then(() =>
		{
			return user.users_table(trx)
			.where('id', id)
			.then(oneMaybe)
		})
	}

	var validate_id = require('../../id').validate.promise(WrongUserId)

	user.create = function (data)
	{
		return knex.transaction(function (trx)
		{
			return ensureEmailNotExists(data.email, trx)
			.then(() =>
			{
				return user.users_table(trx)
				.insert({
					full_name: data.full_name,
					email: null
				}
				, 'id')
				.then(one)
				.then(function (id)
				{
					return createLocalCreds({
						user_id: id,
						password: data.password,
						salt: data.salt
					}, trx)
				})
				.then(function (id)
				{
					return db.notifications.viewed_table(trx)
					.insert({
						recipient_id: id,
						last_viewed_id: 0
					}, 'recipient_id')
					.then(one)
				})
				.then(function (id)
				{
					return user.newEmailUpdate({
						user_id: id,
						new_email: data.email
					}, trx)
				})
			})
		})
	}

	/* ensures email not exists in BOTH tables (sparse unique) */
	// eslint-disable-next-line id-length
	function ensureEmailNotExists (email, trx)
	{
		return user.byEmail(email, trx)
		.then(Err.existent(EmailAlreadyExists))
	}

	user.byEmail = function (email, trx)
	{
		return knex.select('*')
		.transacting(trx)
		.from(function ()
		{
			this.select(
				'users.id AS id',
				'password',
				'salt',
				'full_name',
				'pic',
				knex.raw('COALESCE(users.email, email_confirms.new_email) AS email')
			)
			.from('users')
			.leftJoin(
				'email_confirms',
				'users.id',
				'email_confirms.user_id'
			)
			.leftJoin(
				'auth_local',
				'users.id',
				'auth_local.user_id'
			)
			.as('ignored_alias')
		})
		.where('email', email)
		.then(oneMaybe)
	}

	user.list = function (ids)
	{
		return user.users_table()
		.select('id', 'full_name', 'pic')
		.whereIn('id', ids)
	}

	user.byFacebookId = function (facebook_id)
	{
		return knex.select('id', 'facebook_id')
		.from(function ()
		{
			this.select(
				'users.id AS id',
				'auth_facebook.facebook_id AS facebook_id'
			)
			.from('users')
			.leftJoin(
				'auth_facebook',
				'users.id',
				'auth_facebook.user_id'
			)
			.as('ignored_alias')
		})
		.where('facebook_id', facebook_id)
		.then(oneMaybe)
	}

	user.createFacebook = function (data)
	{
		return knex.transaction(function (trx)
		{
			user.users_table(trx)
			.insert({
				full_name: data.full_name,
				email: null
			}
			, 'id')
			.then(one)
			.then(function (id)
			{
				return user.newEmailUpdate({
					user_id: id,
					new_email: data.email
				}, trx)
			})
			.then(function (id)
			{
				return createFacebookUser({
					user_id: id,
					facebook_id: data.facebook_id
				}, trx)
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
	}

	user.byFB = function (data)
	{
		return user.byFacebookId(data.facebook_id)
		.then(result =>
		{
			if (! result)
			{
				return user.createFacebook(data)
			}
			else
			{
				return result
			}
		})
	}

	function createFacebookUser (data, trx)
	{
		return user.auth_facebook(trx)
		.insert(data, 'user_id')
		.then(one)
	}

	function createLocalCreds (data, trx)
	{
		return user.auth_local(trx)
		.insert(data, 'user_id')
		.then(one)
	}

	user.newEmailByCode = function (code)
	{
		return user.email_confirms()
		.where('code', code)
		.then(oneMaybe)
	}

	user.emailConfirm = function (user_id, new_email)
	{
		return knex.transaction(function (trx)
		{
			return user.users_table(trx)
			.where('id', user_id)
			.update({
				email: new_email
			}, 'id')
			.then(one)
			.then(function (id)
			{
				return newEmailRemove(id, trx)
			})
		})
	}

	function newEmailRemove (user_id, trx)
	{
		return user.email_confirms(trx)
		.where('user_id', user_id)
		.del()
	}

	user.newEmailUpdate = knexed.transact(knex, (trx, data) =>
	{
		data = extend({}, data, { new_email: data.new_email.toLowerCase() })

		return ensureEmailNotExists(data.new_email, trx)
		.then(() =>
		{
			return generate_code()
		})
		.then(code =>
		{
			data.code = code

			return user.email_confirms(trx)
			.insert(data, 'user_id')
			.then(one)
			.catch(err =>
			{
				if (err.constraint === 'email_confirms_pkey')
				{
					return user.email_confirms()
					.update(
					{
						new_email: data.new_email,
						code: data.code
					})
					.where('user_id', data.user_id)
				}
				else
				{
					throw err
				}
			})
		})
	})

	return user
}

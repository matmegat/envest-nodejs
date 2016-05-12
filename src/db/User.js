
var generate_code = require('../crypto-helpers').generate_code
var extend = require('lodash/extend')

var Err = require('../Err')
var EmailAlreadyExists = Err('email_already_use', 'Email already in use')

module.exports = function User (db)
{
	var user = {}

	user.db = db

	var knex = db.knex
	var oneMaybe = db.oneMaybe
	var one = db.one

	user.users_table    = () => knex('users')
	user.email_confirms = () => knex('email_confirms')
	user.auth_facebook  = () => knex('auth_facebook')
	user.auth_local     = () => knex('auth_local')

	user.create = function (data)
	{
		return knex.transaction(function (trx)
		{
			return ensureEmailNotExists(data.email, trx)
			.then(() =>
			{
				return generate_code()
				.then(code =>
				{
					return user.users_table()
					.transacting(trx)
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
						return newEmailCreate({
							user_id: id,
							new_email: data.email,
							code: code
						}, trx)
					})
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

	user.byId = function (id)
	{
		return user.users_table()
		.where('id', id)
		.then(oneMaybe)
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
		return generate_code()
		.then(code =>
		{
			return knex.transaction(function (trx)
			{
				user.users_table()
				.transacting(trx)
				.insert({
					full_name: data.full_name,
					email: null
				}
				, 'id')
				.then(one)
				.then(function (id)
				{
					return newEmailCreate({
						user_id: id,
						new_email: data.email,
						code: code
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
		})
	}

	user.findByFBIDOrCreate = function (data)
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
		return user.auth_facebook()
		.transacting(trx)
		.insert(data, 'user_id')
		.then(one)
	}

	function createLocalCreds (data, trx)
	{
		return user.auth_local()
		.transacting(trx)
		.insert(data, 'user_id')
		.then(one)
	}

	function newEmailCreate (data, trx)
	{
		return user.email_confirms()
		.transacting(trx)
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
			return user.users_table()
			.transacting(trx)
			.where('id', user_id)
			.update({
				email: new_email
			}, 'id')
			.then(one)
			.then(function (id)
			{
				return newEmailDrop(id, trx)
			})
		})
	}

	function newEmailDrop (user_id, trx)
	{
		return user.email_confirms()
		.transacting(trx)
		.where('user_id', user_id)
		.del()
	}

	user.newEmailUpdate = function (data)
	{
		data = extend({}, data, { new_email: data.new_email.toLowerCase() })

		return knex.transaction(function (trx)
		{
			return ensureEmailNotExists(data.new_email, trx)
			.then(() =>
			{
				return user.email_confirms()
				.transacting(trx)
				.insert(data, 'user_id')
				.then(one)
				.catch(err =>
				{
					// UPSERT
					if (err.constraint === 'email_confirms_pkey')
					{
						return user.email_confirms()
						.update({
							new_email: data.new_email,
							code: data.code
						})
						.where('user_id', data.user_id)
					}
				})
			})
		})
	}

	return user
}


var knexed = require('../knexed')

var generate_code = require('../../crypto-helpers').generate_code
var extend = require('lodash/extend')

var pick = require('lodash/pick')

var Password = require('./Password')

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

	user.password = Password(db, user)

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

	user.infoById = function (id)
	{
		return knex.select('*')
		.from(function ()
		{
			this.select(
				'users.id AS id',
				'auth_facebook.facebook_id AS facebook_id',
				'users.first_name AS first_name',
				'users.last_name AS last_name',
				knex.raw('COALESCE(users.email, email_confirms.new_email) AS email'),
				'users.pic AS pic',
				'investors.user_id AS investor_user_id',
				'investors.profile_pic AS profile_pic',
				'investors.profession AS profession',
				'investors.background AS background',
				'investors.historical_returns AS historical_returns',
				'investors.is_public AS is_public',
				'investors.start_date AS start_date',
				'admins.user_id AS admin_user_id',
				'admins.parent AS parent',
				'admins.can_intro AS can_intro'
			)
			.from('users')
			.leftJoin(
				'auth_facebook',
				'users.id',
				'auth_facebook.user_id'
			)
			.leftJoin(
				'email_confirms',
				'users.id',
				'email_confirms.user_id'
			)
			.leftJoin(
				'investors',
				'users.id',
				'investors.user_id'
			)
			.leftJoin(
				'admins',
				'users.id',
				'admins.user_id'
			)
			.as('ignored_alias')
			.where('id', id)
		})
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
		.then(result =>
		{
			var user_data = {}

			user_data = pick(result,
			[
				'id',
				'first_name',
				'last_name',
				'email',
				'pic'
			])

			if (result.investor_user_id)
			{
				user_data.investor = pick(result,
				[
					'profile_pic',
					'profession',
					'background',
					'historical_returns',
					'is_public',
					'start_date',
				])
			}

			if (result.admin_user_id)
			{
				user_data.admin = pick(result,
				[
					'parent',
					'can_intro'
				])
			}

			return user_data
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
					first_name: data.first_name,
					last_name: data.last_name,
					email: null
				}
				, 'id')
				.then(one)
				.then(function (id)
				{
					return user.password.create(id, data.password, trx)
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
				'first_name',
				'last_name',
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
		.select('id', 'first_name', 'last_name', 'pic')
		.whereIn('id', ids)
	}

	user.byFacebookId = function (facebook_id)
	{
		return knex.select('*')
		.from('users')
		.leftJoin(
			'auth_facebook',
			'users.id',
			'auth_facebook.user_id'
		)
		.where('facebook_id', facebook_id)
		.then(oneMaybe)
	}

	user.createFacebook = function (data)
	{
		return knex.transaction(function (trx)
		{
			return user.users_table(trx)
			.insert({
				first_name: data.first_name,
				last_name: data.last_name,
				email: null
			}
			, 'id')
			.then(one)
			.then(id =>
			{
				return user.newEmailUpdate({
					user_id: id,
					new_email: data.email
				}, trx)
			})
			.then(id =>
			{
				return createFacebookUser({
					user_id: id,
					facebook_id: data.facebook_id
				}, trx)
			})
			.then(() =>
			{
				return user.byFacebookId(data.facebook_id)
			})
			.then(result =>
			{
				return result.id
			})
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

			return result.id
		})
		.then(id =>
		{
			return user.infoById(id)
		})
	}

	function createFacebookUser (data, trx)
	{
		return user.auth_facebook(trx)
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

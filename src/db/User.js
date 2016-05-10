
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
	user.auth_local = () => knex('auth_local')

	user.byConfirmedEmail = function (email)
	{
		return user.users_table()
		.where('email', email)
		.then(oneMaybe)
	}

	user.byEmail = function (email)
	{
		return knex.select('*')
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
				'auth_local',
				'users.id',
				'auth_local.user_id'
			)
			.leftJoin(
				'email_confirms',
				'users.id',
				'email_confirms.user_id'
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

	user.byFacebookId = function (id)
	{
		return user.auth_facebook()
		.where('id', facebook_id)
		.then(oneMaybe)
	}

	user.create = function (data)
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
					code: data.code
				}, trx)
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
		.then(inserts =>
		{
			console.log(inserts)
		})
	}

	user.createFacebok = function (data)
	{
		return knex.transaction(function (trx)
		{
			user.users_table()
			.transaction(trx)
			.insert({
				full_name: data.full_name,
				email: data.email
			}
			, 'id')
			.then(one)
			.then(function (id)
			{
				return newFacebookUser({
					user_id: id,
					facebook_id: data.facebook_id
				}, trx)
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
	}

	user.findOrCreate = function (data)
	{
		return user.byFacebookId(data.facebook_id)
		.then(user =>
		{
			if (! user)
			{
				return user.createFacebook(data)
			}
			else
			{
				return user
			}
		})
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

	function newFacebookUser (data, trx)
	{
		return user.auth_facebook()
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
			user.users_table()
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
			.then(trx.commit)
			.catch(trx.rollback)
		})
	}

	function newEmailDrop (user_id, trx)
	{
		return user.email_confirms()
		.transacting(trx)
		.where('user_id', user_id)
		.del()
	}

	return user
}


module.exports = function User (db)
{
	var user = {}

	user.db = db

	var knex = db.knex
	var oneMaybe = db.oneMaybe

	user.users_table = knex('users')
	user.email_confirms = knex('email_confirms')

	user.byConfimedEmail = function (email)
	{
		return user.users_table
		.clone()
		.where('email', email)
		.then(oneMaybe)
	}

	user.byEmail = function (email)
	{
		return knex.select('*')
		.from(function() {this.select('users.id AS id', 'password', 'salt', 'full_name', knex.raw('COALESCE(users.email, email_confirms.new_email) AS email'))
		.from('users')
		.leftJoin('email_confirms', 'users.id', 'email_confirms.user_id').as('ignored_alias')
		})
		.where('email', email)
		.then(oneMaybe)
	}

	user.byId = function (id)
	{
		return user.users_table
		.clone()
		.where('id', id)
		.then(oneMaybe)
	}

	user.create = function (data)
	{
		return user.users_table
		.clone()
		.insert({
			full_name: data.full_name,
			email: null,
			password: data.password,
			salt: data.salt
		}
		, 'id')
	}

	user.newEmailCreate = function (data)
	{
		return user.email_confirms
		.clone()
		.insert({
			user_id:   data.user_id,
			new_email: data.new_email,
			code:      data.code,
		}
		, 'user_id')
	}

	user.newEmailDrop = function (user_id)
	{
		return user.email_confirms
		.clone()
		.where('user_id', user_id)
		.del()
	}

	user.newEmailUpdate = function (data)
	{
		return user.email_confirms
		.clone()
		.where('user_id', data.user_id)
		.update({
			new_email: data.new_email
		}, 'user_id')
	}

	user.newEmailByCode = function (code)
	{
		return user.email_confirms
		.clone()
		.where('code', code)
		.then(oneMaybe)
	}

	user.emailConfirm = function (data)
	{
		return user.users_table
		.clone()
		.where('id', data.user_id)
		.update({
			email: data.new_email
		}, 'id')
		.then(user_id =>
		{
			return user.newEmailDrop(user_id[0])
		})
	}

	return user
}


module.exports = function User (db)
{
	var user = {}

	user.db = db

	var knex = db.knex
	var oneMaybe = db.oneMaybe

	user.users_table = knex('users')
	user.email_confirms = knex('email_confirms')

	user.byEmail = function (email)
	{
		return user.users_table
		.clone()
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
			email: data.email,
			password: data.password,
			salt: data.salt
		}
		, 'id')
	}

	return user
}

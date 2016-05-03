
module.exports = function User (db)
{
	var user = {}

	user.db = db

	var knex = db.knex

	user.users_table = knex('users')
	user.email_confirms = knex('email_confirms')

	user.byEmail = function (email)
	{
		return user.users_table
		.where('email', email)
		.first()
	}

	user.byId = function (id)
	{
		return user.users_table
		.where('id', id)
		.first()
	}

	user.create = function (data)
	{
		return user.users_table
		.insert({
			first_name: data.first_name,
			last_name: data.last_name,
			email: data.email,
			password: data.password,
			salt: data.salt
		})
	}

	return user
}
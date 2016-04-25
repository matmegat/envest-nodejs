
module.exports = function Auth (db)
{
	var auth = {}

	auth.db = db

	var knex = db.knex

	auth.users = knex('users')
	auth.email_confirms = knex('email_confirms')

	// auth.register
	// auth.login
	// forgot
	// change email
	// …

	return auth
}

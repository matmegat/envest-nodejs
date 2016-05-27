
var knexed = require('../knexed')

var expect = require('chai').expect

module.exports = function Admin (db)
{
	var admin = {}

	var exists = db.exists
	var knex   = db.knex

	var table = knexed(knex, 'admins')

	var user = db.user
	expect(db, 'Admin depends on User').property('user')

	admin.is = function (user_id)
	{
		return table()
		.where('user_id', user_id)
		.then(exists)
	}

	admin.intro = function (target_user_id, by_user_id)
	{
		return user.ensureExists(target_user_id)
		.then(() =>
		{
			by_user_id || (by_user_id = null)
		})


		// ...
	}

	return admin
}

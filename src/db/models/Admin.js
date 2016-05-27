
var knexed = require('../knexed')

var Err = require('../../Err')
var AdminRequired =
    Err('admin_required', 'Admin privileges is required for this operation')

var expect = require('chai').expect

module.exports = function Admin (db)
{
	var admin = {}

	var exists = db.exists
	var knex   = db.knex

	var table = knexed(knex, 'admins')

	var user = db.user
	expect(db, 'Admin depends on User').property('user')


	admin.ensure = function (user_id)
	{
		/*
		 * if admin.is() throws by any reason we cast it to `false`
		 * any `false` by any mean leads to AdminRequired error
		 *
		 * so we guarantee that admin-required is OK ONLY if
		 * admin.is() is `true`
		 */
		return admin.is(user_id)

		// if any error occurs, cast them to false
		.catch(debug)

		// capture all falsy values
		.then(Err.falsy(AdminRequired))
	}

	function debug (error)
	{
		console.error('admin-required error')
		console.error(error)

		return false
	}

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

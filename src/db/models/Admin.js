
var knexed = require('../knexed')

var Err = require('../../Err')
var AdminRequired =
    Err('admin_required', 'Admin privileges is required for this operation')

var CannotIntro =
    Err('admin_cannot_intro', 'This admin cannot introduce another')

var expect = require('chai').expect

var noop = require('lodash/noop')

module.exports = function Admin (db)
{
	var admin = {}

	var oneMaybe = db.oneMaybe
	var knex   = db.knex

	var table = knexed(knex, 'admins')

	var user = db.user
	expect(db, 'Admin depends on User').property('user')


	admin.ensure = function (user_id, trx)
	{
		/*
		 * if admin.is() throws by any reason we cast it to `false`
		 * any `false` by any mean leads to AdminRequired error
		 *
		 * so we guarantee that admin-required is OK ONLY if
		 * admin.is() is `true`
		 */
		return admin.is(user_id, trx)

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

	admin.is = function (user_id, trx)
	{
		return admin.byId(user_id, trx)
		.then(Boolean)
	}

	admin.byId = function (user_id, trx)
	{
		return table(trx)
		.where('user_id', user_id)
		.then(oneMaybe)
	}

	admin.intro = knexed.transact(knex, (trx, target_user_id, by_user_id) =>
	{
		by_user_id || (by_user_id = null)

		return Promise.resolve()
		.then(() =>
		{
			if (by_user_id)
			{
				/* check for admin privileges */
				return admin.ensure(by_user_id, trx)
				.then(() =>
				{
					/* check for can_intro */
					return admin.byId(by_user_id)
					.then(by_whom =>
					{
						if (! by_whom.can_intro)
						{
							throw CannotIntro()
						}
					})
				})
			}
			else
			{
				console.warn('admin privileges granted without by_user_id')
			}
		})
		.then(() =>
		{
			return user.ensure(target_user_id, trx)
		})
		.then(() =>
		{
			return table()
			.insert(
			{
				user_id: target_user_id,
				parent:  by_user_id,
				can_intro: false
			})
		})
		.then(noop)
	})

	return admin
}

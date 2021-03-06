
var knexed = require('../knexed')

var Err = require('../../Err')
var AdminRequired =
	Err('admin_required', 'Admin privileges is required for this operation')

var CannotIntro =
	Err('admin_cannot_intro', 'This admin cannot introduce another')

var AlreadyAdmin = Err('already_admin', 'This user is admin already')

var expect = require('chai').expect
var validate = require('../validate')

var noop = require('lodash/noop')

module.exports = function Admin (db)
{
	var admin = {}

	var knex = db.knex
	var table = knexed(knex, 'admins')

	var user = db.user
	expect(db, 'Admin depends on User').property('user')

	var auth = db.auth
	expect(db, 'Investors depends on Auth').property('auth')

	var oneMaybe = db.helpers.oneMaybe

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

	admin.byIds = function (trx, user_ids)
	{
		return table(trx)
		.whereIn('user_id', user_ids)
	}

	admin.ensureCanIntro = function (user_id, trx)
	{
		return admin.ensure(user_id, trx)
		.then(() => admin.byId(user_id, trx))
		.then(admin =>
		{
			if (! admin.can_intro)
			{
				throw CannotIntro()
			}
		})
	}

	admin.intro = knexed.transact(knex, (trx, target_user_id, by_user_id) =>
	{
		by_user_id || (by_user_id = null)

		return new Promise(rs =>
		{
			validate.required(target_user_id, 'target_user_id')
			rs()
		})
		.then(() =>
		{
			if (by_user_id)
			{
				return admin.ensureCanIntro(by_user_id, trx)
			}
			else
			{
				console.warn('admin privileges granted without by_user_id')
			}
		})
		.then(() => user.ensure(trx, target_user_id))
		.then(() =>
		{
			return table(trx)
			.insert(
			{
				user_id: target_user_id,
				parent:  by_user_id,
				can_intro: false
			})
			.catch(Err.fromDb('admins_pkey', AlreadyAdmin))
		})
		.then(noop)
	})

	admin.create = knexed.transact(knex, (trx, by_user_id, userdata) =>
	{
		return auth.registerWithPass(trx, userdata)
		.then(id =>
		{
			return admin.intro(trx, id, by_user_id)
			.then(() => id)
		})
		.then(id =>
		{
			return user.emailConfirm(trx, id, userdata.email)
			.then(() => user.password.reqReset(trx, userdata.email))
		})
		.then(noop)
	})

	return admin
}

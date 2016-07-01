
var knexed = require('../knexed')

var _ = require('lodash')

var Err = require('../../Err')
var AdminRequired =
    Err('admin_required', 'Admin privileges is required for this operation')

var CannotIntro =
    Err('admin_cannot_intro', 'This admin cannot introduce another')

var AlreadyAdmin = Err('already_admin', 'This user is admin already')

var expect = require('chai').expect
var validate = require('../validate')

var PaginatorBooked  = require('../paginator/Booked')

var noop = require('lodash/noop')

module.exports = function Admin (db)
{
	var admin = {}

	var knex = db.knex
	var table = knexed(knex, 'admins')

	var user = db.user
	expect(db, 'Admin depends on User').property('user')

	var oneMaybe = db.helpers.oneMaybe
	var count = db.helpers.count

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

		return new Promise(rs =>
		{
			validate.required(target_user_id, 'target_user_id')
			rs()
		})
		.then(() =>
		{
			if (by_user_id)
			{
				/* check for admin privileges */
				return admin.ensure(by_user_id, trx)
				.then(() =>
				{
					/* check for can_intro */
					return admin.byId(by_user_id, trx)
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
			.catch(Err.fromDb('admins_pkey', AlreadyAdmin))
		})
		.then(noop)
	})

	var paginator = PaginatorBooked()

	admin.usersList = function (user_group, options)
	{
		var queryset = users_by_group(user_group)
		.leftJoin(
			'email_confirms',
			'users.id',
			'email_confirms.user_id'
		)

		if (options.filter.query)
		{
			queryset = filter_by_query(queryset, options.filter.query)
		}

		var count_queryset = queryset.clone()

		queryset
		.select(
			'users.id',
			'users.first_name',
			'users.last_name',
			'users.pic',
			knex.raw('COALESCE(users.email, email_confirms.new_email) AS email')
		)

		options.paginator = _.extend({}, options.paginator,
		{
			real_order_column: 'users.id'
		})

		return paginator.paginate(queryset, options.paginator)
		.then((users) =>
		{
			var response =
			{
				users: users
			}

			return count(count_queryset)
			.then(count =>
			{
				return paginator.total(response, count)
			})
		})
	}

	function users_by_group (group)
	{
		if (user.groups.isUser(group))
		{
			return user.users_table()
			.leftJoin(
				'admins',
				'users.id',
				'admins.user_id'
			 )
			.leftJoin(
				'investors',
				'users.id',
				'investors.user_id'
			)
			.whereNull('admins.user_id')
			.whereNull('investors.user_id')
		}
		else if (user.groups.isAdmin(group))
		{
			return user.users_table()
			.leftJoin(
				'admins',
				'users.id',
				'admins.user_id'
			 )
			.whereNotNull('admins.user_id')
		}
	}

	function filter_by_query (queryset, query)
	{
		var pattern = '%' + query.toLowerCase() + '%'

		return queryset
		.where(function ()
		{
			this.whereRaw("lower(users.first_name || ' ' || users.last_name) LIKE ?",
			pattern)
			this.orWhere('users.email', 'like', pattern)
			this.orWhere('email_confirms.new_email', 'like', pattern)
		})
	}

	return admin
}

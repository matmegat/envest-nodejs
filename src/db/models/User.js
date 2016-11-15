
var knexed = require('../knexed')
var upsert = require('../upsert')

var generate_code = require('../../crypto-helpers').generate_code

var extend = require('lodash/extend')
var pick   = require('lodash/pick')
var ends   = require('lodash/endsWith')
var noop   = require('lodash/noop')

var expect = require('chai').expect

var Password = require('./Password')

var Groups = require('./Groups')

var Err = require('../../Err')
var EmailAlreadyExists = Err('email_already_use', 'Email already in use')

var validate_email = require('../validate').email
var PaginatorBooked = require('../paginator/Booked')
var Sorter = require('../Sorter')
var Filter = require('../Filter')

var validateMany = require('../../id').validateMany

var host_compose = require('../../host-compose')

var moment = require('moment')

module.exports = function User (db, app)
{
	var user = {}

	var mailer = app.mmail

	var knex = db.knex

	var one      = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe
	var count = db.helpers.count

	user.users_table    = knexed(knex, 'users')
	user.email_confirms = knexed(knex, 'email_confirms')
	user.auth_facebook  = knexed(knex, 'auth_facebook')

	user.password = Password(db, user, app)

	user.groups = Groups(db, user)

	user.NotFound = Err('user_not_found', 'User not found')

	user.is = knexed.transact(knex, (trx, user_id) =>
	{
		return user.validateId(user_id)
		.then(() =>
		{
			return user.users_table(trx)
			.select('id')
			.where('users.id', user_id)
			.then(oneMaybe)
		})
		.then(Boolean)
	})

	user.ensure = knexed.transact(knex, (trx, id) =>
	{
		return user.is(trx, id)
		.then(Err.falsy(user.NotFound))
	})

	user.byId = function (id, trx)
	{
		return user.validateId(id)
		.then(() =>
		{
			return user.users_table(trx)
			.select(
				'users.id AS id',
				'first_name',
				'last_name',
				'pic',
				'created_at',
				knex.raw(
					'COALESCE(users.email, email_confirms.new_email) AS email')
			)
			.leftJoin(
				'email_confirms',
				'users.id',
				'email_confirms.user_id'
			)
			.where('users.id', id)
			.then(oneMaybe)
		})
	}

	user.nameByIds = function (ids)
	{
		return user.users_table()
		.select(
			'id',
			'first_name',
			'last_name'
		)
		.whereIn('id', ids)
	}


	var WrongUserId = Err('wrong_user_id', 'Wrong user id')
	user.validateId = require('../../id').validate.promise(WrongUserId)

	user.infoById = function (id)
	{
		return knex.select('*')
		.from(function ()
		{
			this.select(
				'users.id AS id',
				'auth_facebook.facebook_id AS facebook_id',
				'users.first_name AS first_name',
				'users.last_name AS last_name',
				knex.raw(
					'COALESCE(users.email, email_confirms.new_email) AS email'),
				'users.pic AS pic',
				'users.created_at',
				'investors.user_id AS investor_user_id',
				'investors.profile_pic AS profile_pic',
				'investors.profession AS profession',
				'investors.background AS background',
				'investors.historical_returns AS historical_returns',
				'investors.is_public AS is_public',
				'investors.start_date AS start_date',
				'admins.user_id AS admin_user_id',
				'admins.parent AS parent',
				'admins.can_intro AS can_intro',
				knex.raw(`(select end_time
					from subscriptions where user_id = users.id
					and end_time > current_timestamp
					ORDER BY end_time DESC limit 1)`),
				knex.raw(`(select start_time
					from subscriptions where user_id = users.id
					and end_time > current_timestamp
					ORDER BY end_time DESC limit 1)`),
				knex.raw(`COALESCE(
					(select type
					from subscriptions
					where user_id = users.id
					and end_time > current_timestamp
					ORDER BY end_time DESC limit 1),
					'standard') AS type`),
				knex.raw(`(select * from featured_investor
					where investor_id = users.id)
					is not null  as is_featured`)
			)
			.from('users')
			.leftJoin(
				'auth_facebook',
				'users.id',
				'auth_facebook.user_id'
			)
			.leftJoin(
				'email_confirms',
				'users.id',
				'email_confirms.user_id'
			)
			.leftJoin(
				'investors',
				'users.id',
				'investors.user_id'
			)
			.leftJoin(
				'admins',
				'users.id',
				'admins.user_id'
			)
			.as('ignored_alias')
			.where('id', id)
		})
		.then(oneMaybe)
		.then(Err.nullish(user.NotFound))
		.then(result =>
		{
			var user_data = {}

			user_data = pick(result,
			[
				'id',
				'first_name',
				'last_name',
				'email',
				'pic',
				'created_at'
			])

			user_data.subscription = pick(result,
			[
				'type',
				'start_time',
				'end_time'
			])

			if (result.investor_user_id)
			{
				user_data.investor = pick(result,
				[
					'profile_pic',
					'profession',
					'background',
					'historical_returns',
					'annual_return',
					'is_public',
					'start_date',
					'is_featured'
				])
			}

			if (result.admin_user_id)
			{
				user_data.admin = pick(result,
				[
					'parent',
					'can_intro'
				])
			}

			return get_total_payment_days(id)
			.then((total_payment_days) =>
			{
				user_data
				.subscription
				.total_payment_days = total_payment_days

				return user_data
			})
		})
	}

	function get_total_payment_days (user_id)
	{
		var total_payment_days = 0

		return knex('subscriptions')
		.where('user_id', user_id)
		.orderBy('start_time', 'desc')
		.then((subscrs) =>
		{
			if (subscrs.length > 0)
			{
				subscrs.forEach((subscr, i) =>
				{
					var start_time = moment(subscr.start_time).valueOf()
					var end_time = moment(subscr.end_time).valueOf()

					var next_index = i + 1

					if (next_index < subscrs.length)
					{
						var prev_subscr = subscrs[next_index]

						var prev_end_time = moment(prev_subscr.end_time).valueOf()

						if (start_time < prev_end_time)
						{
							end_time -= (prev_end_time - start_time)
						}
					}

					var days = (end_time - start_time) / 24 / 60 / 60 / 1000

					total_payment_days += Math.ceil(days)
				})
			}

			return total_payment_days
		})
	}

	user.create = function (trx, data)
	{
		data.email = data.email.toLowerCase()

		return ensureEmailNotExists(data.email, trx)
		.then(() =>
		{
			return user.users_table(trx)
			.insert({
				first_name: data.first_name,
				last_name: data.last_name,
				email: null,
				pic: 'default-avatar.png',
			}
			, 'id')
			.then(one)
			.then(function (id)
			{
				return user.password.create(id, data.password, trx)
			})
		})
	}

	/* ensures email not exists in BOTH tables (sparse unique) */
	function ensureEmailNotExists (email, trx)
	{
		return user.byEmail(email, trx)
		.then(Err.existent(EmailAlreadyExists))
	}

	var RemoveSelf = Err('remove_self', 'You cannot remove yourself')
	var RemoveAdmin = Err('remove_admin', 'You cannot remove admins')
	var RemoveFeatured = Err('remove_featured',
		'You cannot remove featured investor')

	var includes = require('lodash/includes')

	user.remove = knexed.transact(knex, (trx, user_id, ids) =>
	{
		ids = ids.split(',')
		ids[0] || (ids = [])

		return new Promise(rs =>
		{
			validateMany(WrongUserId, ids)

			ids = ids.map(Number)

			if (includes(ids, user_id))
			{
				throw RemoveSelf()
			}

			return rs()
		})
		.then(() =>
		{
			return db.admin.byIds(trx, ids)
		})
		.then((admins) =>
		{
			if (admins.length > 0)
			{
				return db.admin.byId(user_id, trx)
				.then(me => me.can_intro)
				.then(Err.falsy(RemoveAdmin))
			}
		})
		.then(() =>
		{
			return user.users_table(trx)
			.whereIn('id', ids)
			.del()
		})
		.catch(Err.fromDb(
			'featured_investor_investor_id_foreign',
			RemoveFeatured)
		)
		.then(Err.falsy(user.NotFound))
		.then(noop)
	})

	user.byEmail = function (email, trx)
	{
		return new Promise(rs =>
		{
			validate_email(email)
			return rs()
		})
		.then(() =>
		{
			return knex.select('*')
			.transacting(trx)
			.from(function ()
			{
				this.select(
					'users.id AS id',
					'password',
					'salt',
					'first_name',
					'last_name',
					'pic',
					knex.raw(
						'COALESCE(users.email, email_confirms.new_email) AS email')
				)
				.from('users')
				.leftJoin(
					'email_confirms',
					'users.id',
					'email_confirms.user_id'
				)
				.leftJoin(
					'auth_local',
					'users.id',
					'auth_local.user_id'
				)
				.as('ignored_alias')
			})
			.where('email', email.toLowerCase())
			.then(oneMaybe)
		})
	}

	user.list = function (ids)
	{
		return user.users_table()
		.select('id', 'first_name', 'last_name', 'pic')
		.whereIn('id', ids)
	}

	user.byFacebookId = function (facebook_id, trx)
	{
		return user.users_table(trx)
		.leftJoin(
			'auth_facebook',
			'users.id',
			'auth_facebook.user_id'
		)
		.where('facebook_id', facebook_id)
		.then(oneMaybe)
	}

	user.createFacebook = knexed.transact(knex, (trx, data) =>
	{
		return ensureEmailNotExists(data.email, trx)
		.then(() =>
		{
			var user_data = pick(data,
			[
				'first_name',
				'last_name',
				'email'
			])

			if (data.is_manual)
			{
				user_data.email = null
			}

			return user.users_table(trx)
			.insert(user_data, 'id')
		})
		.then(one)
		.then(id =>
		{
			if (data.is_manual)
			{
				return user.newEmailUpdate(trx,
				{
					user_id: id,
					new_email: data.email
				})
			}
			else
			{
				return id
			}
		})
		.then(id =>
		{
			return createFacebookUser({
				user_id: id,
				facebook_id: data.facebook_id
			}, trx)
		})
		.then(() =>
		{
			return user.byFacebookId(data.facebook_id, trx)
		})
		.then(result =>
		{
			return result.id
		})
	})

	user.byFB = function (data)
	{
		return user.byFacebookId(data.facebook_id)
		.then(result =>
		{
			if (! result)
			{
				return user.createFacebook(data)
			}

			return result.id
		})
		.then(id =>
		{
			return user.infoById(id)
		})
	}

	user.countBySubscriptions = () =>
	{
		var queryset = user.users_table()
		.select(
			knex.raw(`COALESCE(type, 'none') AS subscription`),
			knex.raw(`COUNT(users.id) AS users`)
		)
		.leftJoin(
			'subscriptions',
			'users.id',
			'subscriptions.user_id'
		)
		.groupBy('type')

		return get_only_users(queryset)
	}

	user.countByEmailConfirms = () =>
	{
		var queryset = user.users_table()
		.select(
			knex.raw(`
				COUNT(email) as confirmed_users,
				COUNT(*) - COUNT(email) as unconfirmed_users`)
		)
		.leftJoin(
			'email_confirms',
			'users.id',
			'email_confirms.user_id'
		)

		return get_only_users(queryset)
		.then(oneMaybe)
	}

	function get_only_users (queryset)
	{
		return queryset
		.leftJoin(
			'investors',
			'users.id',
			'investors.user_id'
		)
		.leftJoin(
			'admins',
			'users.id',
			'admins.user_id'
		)
		.whereNull('investors.user_id')
		.whereNull('admins.user_id')
	}

	function createFacebookUser (data, trx)
	{
		return user.auth_facebook(trx)
		.insert(data, 'user_id')
		.then(one)
	}

	user.newEmailByCode = function (code)
	{
		return user.email_confirms()
		.where('code', code)
		.then(oneMaybe)
	}

	user.emailConfirm = knexed.transact(knex, (trx, user_id, new_email) =>
	{
		return user.users_table(trx)
		.where('id', user_id)
		.update({
			email: new_email
		}, 'id')
		.then(one)
		.then(function (id)
		{
			return newEmailRemove(id, trx)
		})
	})

	function newEmailRemove (user_id, trx)
	{
		return user.email_confirms(trx)
		.where('user_id', user_id)
		.del()
	}

	user.newEmailUpdate = function (trx, data)
	{
		data = extend({}, data, { new_email: data.new_email.toLowerCase() })

		return ensureEmailNotExists(data.new_email, trx)
		.then(() =>
		{
			return generate_code()
		})
		.then(code =>
		{
			data.code = code

			var email_confirms_upsert = upsert(
				user.email_confirms(trx),
				'user_id'
			)

			var where = { user_id: data.user_id }

			return email_confirms_upsert(where, data)
			.catch(error =>
			{
				if (error.constraint
				 && ends(error.constraint, 'email_confirms_new_email_unique'))
				{
					throw EmailAlreadyExists()
				}
				else
				{
					throw error
				}
			})
			.then((user_id) =>
			{
				return user.byId(user_id, trx)
			})
			.then(user_item =>
			{
				var host = host_compose(app.cfg)

				var substs =
				{
					first_name: user_item.first_name,
					host: host,
					confirm_code: code
				}

				var data = extend(
					{ to: user_item.email },
					mailer.templates.emailConfirm(substs)
				)

				return mailer.send('default', data, substs)
			})
		})
	}

	var paginator = PaginatorBooked()

	var sorter = Sorter(
	{
		order_column: 'last_name',
		allowed_columns:
		[
			{ column: 'last_name',  aux: 'COLLATE "C"' },
			{ column: 'first_name', aux: 'COLLATE "C"' },
			'email'
		],
		fallback_by: 'id'
	})

	var filter = Filter({
		query: Filter.by.query([]),
		subscription: Filter.by.subscription('type')
	})

	user.byGroup = function (user_group, options)
	{
		var queryset = users_by_group(user_group)
		.leftJoin(
			'email_confirms',
			'users.id',
			'email_confirms.user_id'
		)

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()

		queryset = sorter.sort(queryset, options.sorter)

		queryset
		.select(
			'users.id',
			'users.first_name',
			'users.last_name',
			'users.pic',
			knex.raw('COALESCE(users.email, email_confirms.new_email) AS email')
		)
		.groupBy('users.id', 'email_confirms.new_email')

		options.paginator = extend({}, options.paginator,
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

	var get_pic = require('lodash/fp/get')('pic')

	user.picById = function (id)
	{
		return user.users_table()
		.where('id', id)
		.then(one)
		.then(get_pic)
	}

	user.updatePic = function (data)
	{
		return user.users_table()
		.update(
		{
			pic: data.hash
		})
		.where('id', data.user_id)
	}

	var validate = require('../validate')
	var validate_name = validate.name
	var validate_required = validate.required
	var validate_empty = validate.empty

	var EmptyCredentials = Err('name_credentials_are_empty',
		'Name credentials are empty')

	var change_name = knexed.transact(knex, (trx, user_id, credentials) =>
	{
		var creds_obj = {}

		return user.ensure(trx, user_id)
		.then(() =>
		{
			if (! credentials.first_name && ! credentials.last_name)
			{
				throw EmptyCredentials()
			}

			if ('first_name' in credentials)
			{
				validate_name(credentials.first_name, 'first_name')
				creds_obj.first_name = credentials.first_name
			}

			if ('last_name' in credentials)
			{
				validate_name(credentials.last_name, 'last_name')
				creds_obj.last_name = credentials.last_name
			}

		})
		.then(() =>
		{
			return user.users_table(trx)
			.where('id', user_id)
			.update(creds_obj, 'id')
		})
		.then(one)
	})

	user.changeName = knexed.transact(knex, (trx, user_id, credentials) =>
	{
		return change_name(trx, user_id, credentials)
		.then(noop)
	})


	var Emitter = db.notifications.Emitter

	var NameChangedI = Emitter('username_changed')
	var NameChangedU = Emitter('username_changed', { group: 'admins' })

	user.changeNameAs = knexed.transact(
		knex, (trx, user_id, credentials, whom_id) =>
	{
		return Promise.resolve()
		.then(() =>
		{
			validate_required(user_id, 'target_user_id')
			validate_empty(user_id, 'target_user_id')

			return change_name(trx, user_id, credentials)
		})
		.then(id =>
		{
			return db.investor.all.is(id, trx)
		})
		.then(is_investor =>
		{
			if (is_investor)
			{
				NameChangedI(user_id,
				{
					admin: [ ':user-id', whom_id ]
				})
			}
			else
			{
				NameChangedU(
				{
					user: [ ':user-id', user_id ],
					admin: [ ':user-id', whom_id ]
				})
			}
		})
	})

	return user
}

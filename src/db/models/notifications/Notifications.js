
var knexed = require('../../knexed')
var expect = require('chai').expect

var noop = require('lodash/noop')
var extend = require('lodash/extend')
var map = require('lodash/map')
var each = require('lodash/forEach')

var validate   = require('../../validate')
var validateId = require('../../../id').validate
var Paginator  = require('../../paginator/Booked')

var Err = require('../../../Err')

var Evaluate = require('./Evaluate')

module.exports = function Notifications (db)
{
	var notifications = {}

	var evaluate = Evaluate(db)

	var knex = db.knex

	var paginator = Paginator()

	notifications.table = knexed(knex, 'notifications')

	notifications.Emitter = function Emitter (type, options)
	{
		options = extend({}, options)

		var same_id = SameId(options.same_id)

		return function NotificationEmit (target_or_event, event, trx)
		{
			var emit =
			{
				type: type,
				target: 'investor'
			}

			if (! options.group) /* single */
			{
				expect(target_or_event).a('number')
				var recipient_id = target_or_event

				emit.recipient_id = recipient_id
				emit.event        = event

				if (recipient_id !== same_id(event))
				{
					return create(emit, trx)
				}
				else
				{
					return Promise.resolve()
				}
			}
			else /* group */
			{
				expect(target_or_event).a('object')

				emit.target = options.group
				emit.group = options.group
				emit.event = target_or_event

				/* shift */
				trx = event

				return create_broadcast(emit, same_id(emit.event), trx)
			}
		}
	}

	function create (data, trx)
	{
		return validate_notification(data)
		.then((data) =>
		{
			return notifications.table(trx)
			.insert(data)
			.then(noop)
			.catch(Err.fromDb(
				'notifications_recipient_id_foreign',
				db.user.NotFound
			))
		})
	}

	function create_broadcast (data, self_id, trx)
	{
		return validate_notification(data)
		.then(() =>
		{
			var query_group = get_query_group(data)

			if (self_id != null)
			{
				query_group.where('user_id', '<>', self_id)
			}

			return notifications.table(trx)
			.insert(knex.raw(
				'(type, target, event, recipient_id) ?', [ query_group ]
			))
			.then(noop)
		})
	}


	var WrongRecipientId = Err('wrong_recipient_id', 'Wrong recipient id')

	function validate_notification (data)
	{
		return new Promise(rs =>
		{
			expect(data.type).ok
			expect(data.event).ok

			if (data.recipient_id)
			{
				validateId(WrongRecipientId, data.recipient_id)
			}

			return rs(data)
		})
	}


	var WrongUserGroup = Err('wrong_user_group', 'Wrong user group')

	function get_query_group (data)
	{
		var groups = db.user.groups

		if (groups.isAdmin(data.group) || groups.isInvestor(data.group))
		{
			return knex
			.select(knex.raw(
				'?, ?, ?, user_id', [ data.type, data.target, data.event ]
			))
			.from(data.group)
		}
		else if (groups.isUser(data.group))
		{
			return knex
			.select(knex.raw('?, ?, users.id', [data.type, data.event]))
			.from(data.group)
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
		else
		{
			throw WrongUserGroup()
		}
	}


	var Null = require('lodash/constant')(null)

	function SameId (same_fn)
	{
		if (typeof same_fn === 'function')
		{
			return same_fn
		}
		else if (same_fn == null)
		{
			return Null
		}
		else if (typeof same_fn === 'string')
		{
			return (event) =>
			{
				var field = event[same_fn]

				expect(field).an('array')
				expect(field[0]).equal(':user-id')

				return field[1]
			}
		}
	}


	notifications.list = function (options)
	{
		var queryset = notifications.table()
		.where('recipient_id', options.user_id)
		.andWhere('is_viewed', false)

		var count_queryset = queryset.clone()

		queryset.orderBy('timestamp', 'desc')

		options.page || (options.page = 1)

		return paginator.paginate(queryset, options)
		.then(seq =>
		{
			var events = map(seq, 'event')

			return evaluate(events)
			.then(events =>
			{
				each(events, (event, index) =>
				{
					seq[index].event = event
				})

				return seq
			})
		})
		.then(paginator.total.decorate('notifications', count_queryset))
	}


	var WrongViewedId = Err('wrong_viewed_id', 'Wrong viewed id')

	notifications.setViewed = function (recipient_id, viewed_ids)
	{
		return new Promise(rs =>
		{
			validate.array(viewed_ids, 'viewed_ids')
			viewed_ids.forEach(validateId(WrongViewedId))

			return rs()
		})
		.then(() =>
		{
			return notifications.table()
			.update('is_viewed', true)
			.whereIn('id', viewed_ids)
			.andWhere('recipient_id', recipient_id)
			.then(noop)
		})
	}


	return notifications
}


var knexed = require('../../knexed')
var expect = require('chai').expect

var noop = require('lodash/noop')
var extend = require('lodash/extend')
var map = require('lodash/map')
var each = require('lodash/forEach')

var validate   = require('../../validate')
var validateId = require('../../../id').validate
var Paginator  = require('../../paginator/Ordered')

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

		return function NotificationEmit (target_or_event, event, trx)
		{
			var emit =
			{
				type: type
			}

			if (! options.group) /* single*/
			{
				expect(target_or_event).a('number')

				emit.recipient_id = target_or_event
				emit.event        = event

				return create(emit, trx)
			}
			else /* group */
			{
				expect(target_or_event).a('object')

				emit.group = options.group
				emit.event = target_or_event

				/* shift */
				trx = event

				return create_broadcast(emit, trx)
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

	function create_broadcast (data, trx)
	{
		return validate_notification(data)
		.then(() =>
		{
			var query_group = get_query_group(data)

			return notifications.table(trx)
			.insert(knex.raw('(type, event, recipient_id) ?', [query_group]))
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
			.select(knex.raw('?, ?, user_id', [data.type, data.event]))
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

	notifications.list = function (options)
	{
		var queryset = byUserId(options.user_id)

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
	}

	function byUserId (user_id)
	{
		return notifications.table()
		.where('recipient_id', user_id)
		.andWhere('is_viewed', false)
	}

	notifications.setViewed = function (recipient_id, viewed_ids)
	{
		return validateViewedIds(viewed_ids)
		.then(() =>
		{
			return notifications.table()
			.update('is_viewed', true)
			.whereIn('id', viewed_ids)
			.andWhere('recipient_id', recipient_id)
			.then(noop)
		})
	}

	var WrongViewedId = Err('wrong_viewed_id', 'Wrong viewed id')

	function validateViewedIds (viewed_ids)
	{
		return new Promise(rs =>
		{
			validate.array(viewed_ids, 'viewed_ids')
			viewed_ids.forEach(validateId(WrongViewedId))

			return rs()
		})
	}

	return notifications
}

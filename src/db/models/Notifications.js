
var knexed = require('../knexed')
var expect = require('chai').expect

var noop = require('lodash/noop')

var validate   = require('../validate')
var validateId = require('../../id').validate
var Paginator  = require('../Paginator')
var Emit       = require('./Emit')

var Err = require('../../Err')

module.exports = function Notifications (db)
{
	var notifications = {}

	var knex = db.knex

	var oneMaybe = db.helpers.oneMaybe

	expect(db, 'Notifications depends on User').property('user')
	var user = db.user

	var paginator = Paginator()

	notifications.table = knexed(knex, 'notifications')

	notifications.emit = Emit(db, notifications)

	notifications.create = function (type, event, recipient_id)
	{
		validateNotification(type, event, recipient_id)
		.then((data) =>
		{
			return notifications.table()
			.insert(data)
			.then(noop)
			.catch(Err.fromDb('notifications_recipient_id_foreign', user.NotFound))
		})
	}

	notifications.createBroadcast = function (type, event, group)
	{
		validateNotification(type, event)
		.then(() =>
		{
			var query_group = get_query_group(type, event, group)

			return notifications.table()
			.insert(knex.raw('(type, event, recipient_id) ?', [query_group]))
			.then(noop)
		})
	}

	var WrongUserGroup = Err('wrong_user_group', 'Wrong user group')

	function get_query_group (type, event, group)
	{
		if (user.groups.isAdmin(group) || user.groups.isInvestor(group))
		{
			return knex
			.select(knex.raw('?, ?, user_id', [type, event]))
			.from(group)
		}
		else if (user.groups.isUser(group))
		{
			return knex
			.select(knex.raw('?, ?, users.id', [type, event]))
			.from(group)
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
		.andWhere('is_viewed', false)
	}

	notifications.byIdType = function (user_id, type)
	{
		return byUserId(user_id)
		.andWhere('type', type)
		.andWhere('is_viewed', false)
		.then(oneMaybe)
	}

	function byUserId (user_id)
	{
		return notifications.table()
		.where('recipient_id', user_id)
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

	var WrongRecipientId = Err('wrong_recipient_id', 'Wrong recipient id')

	function validateNotification (type, event, recipient_id)
	{
		return new Promise(rs =>
		{
			validate.required(type, 'type')
			validate.empty(type, 'type')

			validate.required(event, 'event')
			validate.empty(type, 'event')
			validate.json(event, 'event')

			if (recipient_id)
			{
				validateId(WrongRecipientId, recipient_id)
			}

			return rs({
				type: type,
				event: event,
				recipient_id: recipient_id
			})
		})
	}

	return notifications
}

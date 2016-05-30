
var knexed = require('../knexed')

var noop = require('lodash/noop')

var validate = require('../validate')
var validateId = require('../../id').validate
var Paginator = require('../Paginator')

var Err = require('../../Err')

module.exports = function Notifications (db)
{
	var notifications = {}

	var knex = db.knex

	var one = db.helpers.one

	var paginator = Paginator()

	notifications.table = knexed(knex, 'notifications')
	notifications.viewed_table = knexed(knex, 'notifications_viewed')

	notifications.groups = {
		users: ['user'],
		admins: ['admin'],
		investors: ['investor']
	}

	var WrongRecipientId = Err('wrong_recipient_id', 'Wrong recipient id')

	notifications.create = function (type, event, recipient_id)
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
				validateId(recipient_id, WrongRecipientId)
			}

			return rs({
				type: type,
				event: event,
				recipient_id: recipient_id
			})
		})
		.then((data) =>
		{
			return notifications.table()
			.insert(data)
			.then(noop)
			.catch(Err.fromDb('notifications_recipient_id_foreign', db.user.NotFound))
		})
	}

	notifications.list = function (options)
	{
		var queryset = byUserId(options.user_id)

		return notifications.lastViewedId(options.user_id)
		.then((last_viewed_id) =>
		{
			return paginator.paginate(queryset, options)
			.andWhere('id', '>', last_viewed_id)
			.orWhereIn('type', notifications.groups[options.user_group])
			.andWhere('id', '>', last_viewed_id)
		})
	}

	function byUserId (user_id)
	{
		return notifications.table()
		.where('recipient_id', user_id)
	}

	notifications.lastViewedId = function (user_id)
	{
		return notifications.viewed_table()
		.where('recipient_id', user_id)
		.then(one)
		.then(row => row.last_viewed_id)
	}

	var WrongViewedId = Err('wrong_viewed_id', 'Wrong viewed id')

	notifications.setLastViewedId = function (recipient_id, last_viewed_id)
	{
		return new Promise(rs =>
		{
			return rs(validateId(last_viewed_id, WrongViewedId))
		})
		.then(() =>
		{
			return notifications.lastViewedId(recipient_id)
			.then((viewed_id) =>
			{
				if (viewed_id < last_viewed_id)
				{
					return notifications.viewed_table()
					.update('last_viewed_id', last_viewed_id)
					.where('recipient_id', recipient_id)
					.then(noop)
				}
			})
		})
	}

	return notifications
}

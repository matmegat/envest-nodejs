
var knexed = require('../knexed')

var noop = require('lodash/noop')

var validate = require('../validate')
var validateId = require('../../id').validate

var Err = require('../../Err')

module.exports = function Notifications (db)
{
	var notifications = {}

	var knex = db.knex

	var oneMaybe = db.helpers.oneMaybe

	notifications.table = knexed(knex, 'notifications')
	notifications.viewed_table = knexed(knex, 'notifications_viewed')

	var WrongRecipientId = Err('wrong_recipient_id', 'Wrong recipient id')

	notifications.create = function (data)
	{
		return new Promise(rs =>
		{
			validate.required(data.type, 'type')
			validate.empty(data.type, 'type')

			validate.required(data.event, 'event')
			validate.empty(data.type, 'event')
			validate.json(data.event, 'event')

			validate.required(data.recipient_id, 'recipient_id')
			validateId(data.recipient_id, WrongRecipientId)

			return rs(data)
		})
		.then( data =>
		{
			return notifications.table()
			.insert(data)
			.then(noop)
			.catch(Err.fromDb('notifications_recipient_id_foreign', db.user.NotFound))
		})

	}

	notifications.list = function (user_id)
	{
		return notifications.lastViewedId(user_id)
		.then((last_viewed_id) =>
		{
			return notifications.table()
			.where('recipient_id', user_id)
			.andWhere('id', '>', last_viewed_id)
		})
	}

	notifications.lastViewedId = function (user_id)
	{
		return notifications.viewed_table()
		.where('recipient_id', user_id)
		.then(oneMaybe)
		.then(row => row.last_viewed_id)
	}

	var WrongViewedId = Err('wrong_viewed_id', 'Wrong viewed id')

	notifications.setLastViewedId = function (recipient_id, last_viewed_id)
	{
		return new Promise(rs =>
		{
			validateId(last_viewed_id, WrongViewedId)

			return rs()
		})
		.then( () =>
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

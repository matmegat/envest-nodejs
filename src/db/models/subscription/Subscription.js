
var knexed = require('../../knexed')

var _ = require('lodash')

var moment = require('moment')

var validate    = require('../../validate')
var validate_time = validate.time

var validateId = require('../../../id').validate.promise

var Err = require('../../../Err')

module.exports = function Subscription (db, subsc_desc)
{
	var subscription = {}

	var knex = db.knex

	subscription.table = knexed(knex, 'subscriptions')

	var includes = _.includes

	subscription.isAble = function (user_id, feature)
	{
		return by_user_id(user_id)
		.then((items) =>
		{
			items.forEach((item) =>
			{
				if (includes(subsc_desc[item.type].feature, feature))
				{
					return true
				}
			})
		})
	}

	subscription.activate = function (user_id, type, days)
	{
		return validate_type(type)
		.then(() =>
		{
			days = days || subsc_desc[type].days

			if (subsc_desc[type].once)
			{
				return once_activate(user_id, type, days)
			}
			else
			{
				return activate(user_id, type, days)
			}
		})
	}

	var noop  = _.noop

	function activate (user_id, type, days)
	{
		return counting_time(user_id, days)
		.then((time) =>
		{
			subscription.table()
			.insert(
			{
				user_id: user_id,
				type: type,
				end_time: time
			})
			.then(noop)
			.catch(Err.fromDb('subscription_user_id_foreign', db.user.NotFound))
		})
	}

	function counting_time (user_id, days)
	{
		var time = moment().add(days, 'days')

		return new Promise(rs =>
		{
			validate_time(time, 'subscription')

			return rs()
		})
		.then(() =>
		{
			return by_user_id(user_id)
			.then((items) =>
			{
				if (items.length === 0)
				{
					return time
				}

				var end_time = moment(items[0].end_time)

				var remaining_time = end_time.subtract(moment())

				return time.add(remaining_time)
			})
		})
	}

	var OnlyOnceActivate = Err('only_once_activate', 'Subscription can be activated only once')

	function once_activate (user_id, type, days)
	{
		return by_user_id_type(user_id, type)
		.then((items) =>
		{
			if (items.length === 0)
			{
				return activate(user_id, type, days)
			}
			else
			{
				throw OnlyOnceActivate({ type: type })
			}
		})
	}

	var WrongType = Err('wrong_subscription_type', 'Wrong subscription type')

	function validate_type (type)
	{
		return new Promise(rs =>
		{
			if (! (type in subsc_desc))
			{
				throw WrongType()
			}

			return rs()
		})
	}

	var WrongUserId = Err('wrong_user_id', 'Wrong user id')

	function by_user_id (user_id)
	{
		return validateId(WrongUserId, user_id)
		.then(() =>
		{
			return subscription.table()
			.where('user_id', user_id)
			.andWhere('end_time', '>', moment())
			.orderBy('end_time', 'desc')
		})
	}

	function by_user_id_type (user_id, type)
	{
		return validateId(WrongUserId, user_id)
		.then(() =>
		{
			return subscription.table()
			.where('user_id', user_id)
			.andWhere('type', type)
		})
	}

	return subscription
}

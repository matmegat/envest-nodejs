
var knexed = require('../../knexed')

var _ = require('lodash')

var moment = require('moment')
var validate   = require('../../validate')
var isPositive   = validate.integer.positive
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
				if (includes(subsc_desc[item.type], feature))
				{
					return true
				}
			})
		})
	}

	var curry = _.curry
	var noop  = _.noop

	var activate = subscription.activate = curry((type, days, user_id) =>
	{
		var end_time = moment.add(days, 'days')

		return validate_type(type)
		.then(() =>
		{
			return validate_days(days)
		})
		.then(() =>
		{
			return counting_time(user_id, end_time)
		})
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
	})

	var OnlyOnceActivate = Err('only_once_activate', 'Subscription can be activated only once')

	subscription.onceActivate = curry((type, days, user_id) =>
	{
		return validate_type(type)
		.then(() =>
		{
			return validate_days(days)
		})
		.then(() =>
		{
			return by_user_id_type(user_id, type)
		})
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
	})

	var WrongType = Err('wrong_subscription_type', 'Wrong subscription type')

	function validate_type (type)
	{
		return new Promise(rs =>
		{
			if (! (type in subsc_desc))
			{
				throw WrongType()
			}

			return rs(type)
		})
	}

	function validate_days (days)
	{
		return new Promise(rs =>
		{
			isPositive('subscription_days', days)

			return rs(days)
		})
	}

	function counting_time (user_id, time)
	{
		return validate_time(time)
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

	var WrongTime = Err('wrong_subscription_time', 'Wrong subscription time')

	function validate_time (time)
	{
		return new Promise(rs =>
		{
			if (! time.isValid())
			{
				throw WrongTime()
			}

			return rs(time)
		})
	}

	var WrongUserId = Err('wrong_user_id', 'Wrong user id')

	function by_user_id (user_id)
	{
		return validateId(WrongUserId)
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
		return validateId(WrongUserId)
		.then(() =>
		{
			return subscription.table()
			.where('user_id', user_id)
			.andWhere('type', type)
		})
	}

	return subscription
}

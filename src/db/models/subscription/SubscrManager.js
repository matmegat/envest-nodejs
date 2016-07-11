
var knexed = require('../../knexed')

var _ = require('lodash')

var moment = require('moment')

var validate    = require('../../validate')
var validate_date = validate.date

var validateId = require('../../../id').validate.promise

var Err = require('../../../Err')

module.exports = function SubscrManager (db, subsc_desc)
{
	var subscr_manager = {}

	var knex = db.knex

	subscr_manager.table = knexed(knex, 'subscriptions')

	var includes = _.includes
	var find = _.find

	var WrongUserId = Err('wrong_user_id', 'Wrong user id')

	subscr_manager.isAble = function (user_id, feature)
	{
		return validateId(WrongUserId, user_id)
		.then(() =>
		{
			return get_active_subscr(user_id)
		})
		.then((items) =>
		{
			return find(items, (item) =>
			{
				return includes(subsc_desc[item.type].feature, feature)
			})
		})
	}

	var noop  = _.noop

	subscr_manager.activate = function (user_id, type, days)
	{
		return validateId(WrongUserId, user_id)
		.then(() =>
		{
			return validate_type(type)
		})
		.then(() =>
		{
			days = days || subsc_desc[type].days

			return subsc_desc[type].fn(user_id, subscr_manager.table)
			.then(() =>
			{
				return calculate_whole_range(user_id, days)
			})
			.then((date) =>
			{
				subscr_manager.table()
				.insert(
				{
					user_id: user_id,
					type: type,
					end_time: date
				})
				.then(noop)
				.catch(Err.fromDb('subscription_user_id_foreign', db.user.NotFound))
			})
		})
	}

	function calculate_whole_range (user_id, days)
	{
		var date = moment().add(days, 'days')

		return new Promise(rs =>
		{
			validate_date(date)

			return rs()
		})
		.then(() =>
		{
			return get_active_subscr(user_id)
			.then((items) =>
			{
				if (items.length === 0)
				{
					return date
				}

				var end_time = moment(items[0].end_time)

				var remaining_time = end_time.subtract(moment())

				return date.add(remaining_time)
			})
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

	function get_active_subscr (user_id)
	{
		return subscr_manager.table()
		.where('user_id', user_id)
		.andWhere('end_time', '>', moment())
		.orderBy('end_time', 'desc')
	}

	return subscr_manager
}

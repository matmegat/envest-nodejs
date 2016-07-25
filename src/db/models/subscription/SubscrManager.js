
var knexed = require('../../knexed')

var _ = require('lodash')

var moment = require('moment')

var expect = require('chai').expect

var validate      = require('../../validate')
var validate_date = validate.date
var isPositive    = validate.integer.positive

var validateId = require('../../../id').validate

var Err = require('../../../Err')

module.exports = function SubscrManager (db, subsc_desc)
{
	var subscr_manager = {}

	var knex = db.knex

	subscr_manager.table = knexed(knex, 'subscriptions')

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var SubscrActivateA = Emitter('subscr_activate', { group: 'admins' })
	var SubscrActivateU = Emitter('subscr_activate')

	var includes = _.includes
	var find = _.find

	var WrongUserId = Err('wrong_user_id', 'Wrong user id')

	subscr_manager.isAble = function (user_id, feature)
	{
		return new Promise(rs =>
		{
			validateId(WrongUserId, user_id)
			return rs()
		})
		.then(() =>
		{
			return get_active_subscrs(user_id)
		})
		.then((subscrs) =>
		{
			return find(subscrs, (subscr) =>
			{
				return includes(subsc_desc[subscr.type].features, feature)
			})
		})
	}

	var noop  = _.noop

	subscr_manager.activate = function (user_id, type, days, trx)
	{
		days = days || subsc_desc[type].days

		return new Promise(rs =>
		{
			validateId(WrongUserId, user_id)
			validate_type(type)
			isPositive(days, 'days')

			return rs()
		})
		.then(() =>
		{
			return subsc_desc[type].fn(user_id, subscr_manager.table)
			.then(() =>
			{
				return calculate_whole_range(user_id, days)
			})
			.then((date) =>
			{
				return subscr_manager.table(trx)
				.insert(
				{
					user_id: user_id,
					type: type,
					end_time: date
				})
				.then(noop)
				.catch(Err.fromDb(
				'subscriptions_user_id_foreign',
				db.user.NotFound))
			})
		})
		.then(() =>
		{
			return SubscrActivateA(
			{ user_id: user_id, type: type, days: days }, trx)
		})
		.then(() =>
		{
			return SubscrActivateU(user_id, { type: type, days: days }, trx)
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
			return get_active_subscrs(user_id)
			.then((subscrs) =>
			{
				if (subscrs.length === 0)
				{
					return date
				}

				var end_time = moment(subscrs[0].end_time).valueOf()
				var remaining_time = end_time - moment().valueOf()
				var time = date.valueOf() + remaining_time

				return moment(time)
			})
		})
	}

	var WrongType = Err('wrong_subscription_type', 'Wrong subscription type')

	function validate_type (type)
	{
		if (! (type in subsc_desc))
		{
			throw WrongType()
		}
	}

	function get_active_subscrs (user_id)
	{
		return subscr_manager.table()
		.where('user_id', user_id)
		.andWhere('end_time', '>', moment())
		.orderBy('end_time', 'desc')
	}

	return subscr_manager
}

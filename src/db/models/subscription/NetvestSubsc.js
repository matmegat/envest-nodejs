
var SubscrManager = require('./SubscrManager')
var PromoCode = require('./PromoCode')

var knexed = require('../../knexed')

var Err = require('../../../Err')

var expect = require('chai').expect
var validate = require('../../validate')
var curry = require('lodash/curry')

module.exports = function NetvestSubsc (db)
{
	var knex = db.knex

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter
	var SubscrEnterPromoA = Emitter('enter_promo', { group: 'admins' })

	var OnlyOnceActivate = Err(
	'only_once_activate',
	'Subscription can be activated only once')

	var NoSubscription = Err('no_subscription', 'No Subscription')

	var once_update = curry((type, user_id, subscr_table) =>
	{
		return by_user_id_type(user_id, type, subscr_table)
		.then((items) =>
		{
			if (items.length > 1)
			{
				throw OnlyOnceActivate({ type: type })
			}
		})
	})

	function by_user_id_type (user_id, type, subscr_table)
	{
		return subscr_table()
		.where('user_id', user_id)
		.andWhere('type', type)
	}

	var netvest_subscr = SubscrManager(db,
	{
		premium:
		{
			days: 30,
			features: [ 'multiple_investors' ],
			fn: () => Promise.resolve()
		},
		trial:
		{
			days: 30,
			features: [ 'multiple_investors' ],
			fn: once_update('trial')
		}
	})

	netvest_subscr.table = knexed(knex, 'subscriptions')
	netvest_subscr.promo = PromoCode(db)

	netvest_subscr.promo.activate = knexed.transact(knex, (trx, code, user_id) =>
	{
		return netvest_subscr.promo.isValid(code, trx)
		.then(item =>
		{
			return netvest_subscr.activate(user_id, item.type, null, trx)
		})
		.then(subscr =>
		{
			return netvest_subscr.promo.decrement(code, trx)
			.then(() =>
			{
				return SubscrEnterPromoA(
				{
					user: [ ':user-id', user_id ],
					code: code
				})
			})
			.then(() =>
			{
				return subscr
			})
		})
	})

	netvest_subscr.buyActivation = function (option)
	{
		return new Promise(rs =>
		{
			validate.required(option.user_id, 'user_id')
			validate.required(option.plan, 'plan')
			validate.required(option.stripe_customer_id, 'stripe_customer_id')
			validate.required(option.stripe_subscriber_id, 'stripe_subscriber_id')

			return rs(option)
		})
		.then(option =>
		{
			return netvest_subscr.table()
			.insert(option, 'id')
			.then(id =>
			{
				return id[0] > 0
			})
		})
	}

	netvest_subscr.getSubscription = (user_id) =>
	{
		return netvest_subscr.table()
		.where('user_id', user_id)
		.then(subscription =>
		{
			if (subscription.length > 0)
			{
				return subscription[0]
			}
			else
			{
				throw NoSubscription()
			}
		})
	}

	netvest_subscr.cancelSubscription = (user_id) =>
	{
		return netvest_subscr.table()
		.where('user_id', user_id)
		.delete()
	}

	return netvest_subscr
}

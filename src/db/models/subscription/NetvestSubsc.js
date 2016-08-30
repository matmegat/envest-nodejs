
var knexed = require('../../knexed')

var Err = require('../../../Err')

var expect = require('chai').expect
var validate = require('../../validate')

module.exports = function NetvestSubsc (db, cfg)
{
	var netvest_subscr = {}

	var knex = db.knex

	expect(db, 'Onboarding depends on Notifications').property('notifications')

	var NoSubscription = Err('no_subscription', 'No Subscription')

	netvest_subscr.table = knexed(knex, 'subscriptions')
	netvest_subscr.stripe = require('stripe')(cfg.secret_key)

	netvest_subscr.addSubscription = function (option)
	{
		return new Promise(rs =>
		{
			validate.required(option.user_id, 'user_id')
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
		.then(result =>
		{
			return { success: result === 1 }
		})
	}

	return netvest_subscr
}

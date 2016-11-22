
var expect = require('chai').expect
var moment = require('moment')

var knexed = require('../../knexed')

var Err = require('../../../Err')

module.exports = function NetvestSubsc (db, cfg, mailer)
{
	var netvest_subscr = {}

	var knex = db.knex

	expect(db, 'Onboarding depends on Notifications').property('notifications')

	var NoSubscription = Err('no_subscription', 'No Subscription')
	var StripeError = Err('stripe_error', 'Stripe API call failed')

	netvest_subscr.table = knexed(knex, 'subscriptions')
	netvest_subscr.stripe = require('stripe')(cfg.secret_key)

	var count = db.helpers.count

	netvest_subscr.addSubscription = function (user_id, subscription_data)
	{

		return db.user.byId(user_id)
		.then(user =>
		{
			var billing_start = moment(user.created_at).add(1, 'month')

			if (moment().isBefore(billing_start))
			{
				subscription_data.trial_end = Math.floor(billing_start / 1000)
			}
			else
			{
				subscription_data.trial_end = 'now'
			}

			return new Promise((rs, rj) =>
			{
				netvest_subscr.stripe.customers.create(
					subscription_data,
					(err, customer) =>
					{
						if (err)
						{
							rj(StripeError())
						}
						else
						{
							var subscription = customer.subscriptions.data[0]
							var option =
							{
								user_id: user_id,
								type: subscription_data.plan,
								stripe_customer_id: customer.id,
								stripe_subscriber_id: subscription.id,
								end_time: moment(subscription.current_period_end * 1000)
								.format('YYYY-MM-DD HH:mm:ss Z')
							}

							netvest_subscr.table()
							.insert(option, 'id')
							.then(id =>
							{
								rs(id[0] > 0)
							})
						}
					}
				)
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
		.then(() =>
		{ // send Trial Expired
			return db.user.byId(user_id)
			.then(user =>
			{
				var substs =
				{
					email_title: [ 'Trial Expired' ],
				}

				return mailer.send(`default`, substs,
				{
					to: user.email,
					subject: `Trial Expired`,
					// text: '',
					html: `Hi, ${user.first_name} ${user.last_name}.` +
						`<br/><br/>` +
						`Your trial period has expired. ` +
						`Now you can track only one investor. ` +
						`Please visit our <a href="http://www.netvest.com">` +
						`website</a> for premium subscription ` +
						`to get full access to all the investors and insights.`
				})
			})
		})
		.then(result =>
		{
			return { success: result === 1 }
		})
	}

	netvest_subscr.extendSubscription = (subscription_id, next_period_end) =>
	{
		return netvest_subscr.table()
		.where('stripe_subscriber_id', subscription_id)
		.update({
			end_time: moment(next_period_end * 1000)
		})
		.then(result =>
		{
			return { success: result === 1 }
		})
	}


	netvest_subscr.isAble = (user_id) =>
	{
		return netvest_subscr
		.getSubscription(user_id)
		.then(() => true)
		.catch(() =>
		{
			/* WORKAROUND:
			    check for 30-trial period
			    even if no Stripe involved, see NET-1675
			*/
			return db.user.byId(user_id)
			.then(user =>
			{
				var trial_end = moment(user.created_at).add(1, 'month')

				return moment().isBefore(trial_end)
			})
		})
	}

	netvest_subscr.getType = (user_id) =>
	{
		return netvest_subscr
		.getSubscription(user_id)
		.then(subscription =>
		{
			return {
				type: 'premium',
				start_time: subscription.start_time,
				end_time: subscription.end_time
			}
		})
		.catch(() =>
		{
			return db.user.byId(user_id)
			.then(user =>
			{
				var trial_end = moment(user.created_at).add(1, 'month')

				if (moment().isBefore(trial_end))
				{
					return {
						type: 'trial',
						start_time: user.created_at,
						end_time: trial_end
					}
				}
				else
				{
					return {
						type: 'standard',
						start_time: user.created_at,
						end_time: trial_end
					}
				}
			})
		})
	}

	netvest_subscr.countBySubscriptions = () =>
	{
		var result = {}
		var user_subscriptions_table = db.user.usersSubscriptions

		return count(user_subscriptions_table()
		.where('created_at', '>', moment().subtract(1, 'month'))
		.whereNull('subscriptions.user_id'))
		.then(trial_count =>
		{
			result.trial = trial_count

			return count(user_subscriptions_table()
			.where('created_at', '<=', moment().subtract(1, 'month'))
			.whereNull('subscriptions.user_id'))
		})
		.then(standard_count =>
		{
			result.standard = standard_count

			return count(user_subscriptions_table()
			.whereNotNull('subscriptions.user_id'))
		})
		.then(premium_count =>
		{
			result.premium = premium_count

			return result
		})
	}

	return netvest_subscr
}

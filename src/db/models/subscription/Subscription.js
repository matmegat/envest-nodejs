
var expect = require('chai').expect
var extend = require('lodash/extend')
var moment = require('moment')

var knexed = require('../../knexed')

var Err = require('../../../Err')

module.exports = function NetvestSubsc (db, cfg, mailer)
{
	var netvest_subscr = {}

	var knex = db.knex
	var one = db.helpers.one

	expect(db, 'Onboarding depends on Notifications').property('notifications')

	var NoSubscription = Err('no_subscription', 'No Subscription')
	var StripeError = Err('stripe_error', 'Stripe API call failed')

	netvest_subscr.table = knexed(knex, 'subscriptions')
	netvest_subscr.stripe = require('stripe')(cfg.secret_key)


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
							console.log(err);
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
								// send Paid Subscriber email
								if (id[0] > 0)
								{
									db.user.byId(user_id)
									.then(user =>
									{
										var substs = extend({}, mailer.substs_defaults,
										{
											first_name: user.first_name,
										})

										var data = extend(
											{ to: user.email },
											mailer.templates.paidSubscriber(substs)
										)

										rs(mailer.send('default', data, substs))
									})
								}
								else
								{
									rs({ success: false })
								}
							})
						}
					}
				)
			})
		})
	}

	netvest_subscr.updateCard = function (user_id, card_data)
	{
		return netvest_subscr
		.getSubscription(user_id)
		.then(subscription =>
		{
			return new Promise((rs, rj) =>
			{
				var old_customer_id = subscription.stripe_customer_id
				netvest_subscr.stripe.customers.update(
					old_customer_id,
					{
						source: card_data.source
					},
					(err) =>
					{
						if (err)
						{
							rj(StripeError())
						}
						else
						{
							rs({ success: true })
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
		.orderBy('id', 'desc')
		.then(Err.emptish(NoSubscription))
		.then((subscriptions) => subscriptions[0])
	}

	netvest_subscr.getTotalPaymentDays = (user_id) =>
	{
		return netvest_subscr.getSubscription(user_id)
		.then(subscr =>
		{
			var start_time = +new Date(subscr.start_time)
			var end_time = +new Date(subscr.end_time)

			return Math.floor((end_time - start_time) / 24 / 60 / 60 / 1000)
		})
		.catch(() =>
		{
			return 0
		})
	}

	netvest_subscr.cancelSubscription = (user_id) =>
	{
		return netvest_subscr.table()
		.where('user_id', user_id)
		.update({
			status: 'inactive'
		})
		.then(() =>
		{ // send Trial Expired
			return db.user.byId(user_id)
			.then(user =>
			{
				var substs =
				{
					first_name: user.first_name,
					website_link: 'netvest.com',
					feedback_link: 'netvest_link'
				}

				var data = extend(
					{ to: user.email },
					mailer.templates.trialExpired(substs)
				)

				return mailer.send('default', data, substs)
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
		.then((subscription) =>
		{
			return moment().isBefore(subscription.end_time)
		})
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
			if (moment().isBefore(subscription.end_time))
			{
				return {
					type: 'premium',
					start_time: subscription.start_time,
					end_time: subscription.end_time
				}
			}
			else
			{
				return {
					type: 'standard',
					start_time: subscription.start_time,
					end_time: subscription.end_time
				}
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

		var user_subscrs = db.user.users_table_only()
		.distinct()
		.select('users.id')
		.leftJoin(
			'subscriptions',
			'users.id',
			'subscriptions.user_id'
		)

		function get_count (queryset)
		{
			return knex.select(
				knex.raw('COUNT(*) FROM (?) AS q', queryset)
			)
		}

		return get_count(
			user_subscrs.clone()
			.where('created_at', '>', moment().subtract(1, 'month').format())
			.whereNull('subscriptions.user_id')
		)
		.then(one)
		.then(trial =>
		{
			result.trial = trial.count

			return get_count(
				user_subscrs.clone()
				.where('created_at', '<=', moment().subtract(1, 'month').format())
				.whereRaw('subscriptions.user_id is null or end_time < now()')
			)
		})
		.then(one)
		.then(standard =>
		{
			result.standard = standard.count

			return get_count(
				user_subscrs.clone()
				.whereNotNull('subscriptions.user_id')
				.where('subscriptions.end_time', '>', moment().format())
			)
		})
		.then(one)
		.then(premium =>
		{
			result.premium = premium.count

			return result
		})
	}

	return netvest_subscr
}

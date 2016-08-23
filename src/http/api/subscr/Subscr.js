
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function Subscr (subscr_model, cfg)
{
	var subscr = {}

	subscr.model = subscr_model
	subscr.express = Router()
	subscr.config = cfg

	subscr.express.post('/activate', (rq, rs) =>
	{
		var stripe = require('stripe')(subscr.config.stripe.secret_key)
		stripe.customers.create(
			{ source: rq.body.stripe_token },
			(err, customer) =>
			{
				if (err)
				{
					return toss.err(rs, err)
				}

				stripe.subscriptions.create(
					{
						customer: customer.id,
						plan: rq.body.plan,
						coupon: rq.body.coupon
					},
					(err, subscription) =>
					{
						if (err)
						{
							return toss.err(rs, err)
						}

						var subscription_data =
						{
							user_id: rq.user.id,
							plan: rq.body.plan,
							type: 'some type?',
							stripe_customer_id: customer.id,
							stripe_subscriber_id: subscription.id
						}

						toss(rs, subscr.model.buyActivation(subscription_data))
					}
				)
			}
		)
	})

	subscr.express.get('/', (rq, rs) =>
	{
		subscr.model.getSubscription(rq.user.id)
		.then(subscription =>
		{
			var stripe = require('stripe')(subscr.config.stripe.secret_key)
			stripe.subscriptions.retrieve(
				subscription.stripe_subscriber_id,
				(err, subscription_obj) =>
				{
					if (err)
					{
						return toss.err(rs, err)
					}

					// this is to retreive full subscription object
					subscription.meta = subscription_obj
					toss(rs, subscription)
				}
			)
		})
		.catch(toss.err(rs))
	})

	subscr.express.post('/deactivate', (rq, rs) =>
	{
		subscr.model.getSubscription(rq.user.id)
		.then(subscription =>
		{
			var stripe = require('stripe')(subscr.config.stripe.secret_key)
			stripe.subscriptions.del(
				subscription.stripe_subscriber_id,
				(err) =>
				{
					if (err)
					{
						return toss.err(rs, err)
					}

					subscr.model.cancelSubscription(rq.user.id)
					.then(result =>
					{
						var res =
						{
							success: result === 1
						}

						toss(rs, res)
					})
				}
			)
		})
		.catch(toss.err(rs))
	})

	return subscr
}

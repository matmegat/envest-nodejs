
var Router = require('express').Router
var toss = require('../../toss')

module.exports = function Subscr (subscr_model)
{
	var subscr = {}

	subscr.model = subscr_model
	subscr.express = Router()

	subscr.express.post('/activate', (rq, rs) =>
	{
		var trial_end = 1473014984 // this should be set with actual value
		subscr.model.stripe.customers.create(
			{
				source: rq.body.stripe_token,
				plan: rq.body.plan,
				coupon: rq.body.coupon,
				trial_end: trial_end
			},
			(err, customer) =>
			{
				if (err)
				{
					return toss.err(rs, err)
				}

				var subscription = customer.subscriptions.data[0]
				var subscription_data =
				{
					user_id: rq.user.id,
					type: rq.body.plan,
					stripe_customer_id: customer.id,
					stripe_subscriber_id: subscription.id
				}

				toss(rs, subscr.model.addSubscription(subscription_data))
			}
		)
	})

	subscr.express.get('/', (rq, rs) =>
	{
		subscr.model.getSubscription(rq.user.id)
		.then(subscription =>
		{
			subscr.model.stripe.subscriptions.retrieve(
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
			subscr.model.stripe.subscriptions.del(
				subscription.stripe_subscriber_id,
				(err) =>
				{
					if (err)
					{
						return toss.err(rs, err)
					}

					toss(rs, subscr.model.cancelSubscription(rq.user.id))
				}
			)
		})
		.catch(toss.err(rs))
	})

	return subscr
}

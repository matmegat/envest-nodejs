
var Router = require('express').Router
var toss = require('../../toss')
var authRequired = require('../../auth-required')

module.exports = function Subscr (subscr_model)
{
	var subscr = {}

	subscr.model = subscr_model
	subscr.express = Router()

	subscr.express.post('/activate', authRequired, (rq, rs) =>
	{
		var subscription_data = {
			source: rq.body.stripe_token,
			plan: rq.body.plan,
			coupon: rq.body.coupon
		}
		if (! subscription_data.coupon)
		{
			delete subscription_data.coupon
		}
		toss(rs, subscr.model.addSubscription(rq.user.id, subscription_data))
	})

	subscr.express.post('/updatecard', authRequired, (rq, rs) =>
	{
		var card_data = {
			source: rq.body.stripe_token
		}
		toss(rs, subscr.model.updateCard(rq.user.id, card_data))
	})

	subscr.express.get('/', authRequired, (rq, rs) =>
	{
		subscr.model.getSubscription(rq.user.id)
		.then(subscription =>
		{
			subscr.model.stripe.customers.retrieve(
				subscription.stripe_customer_id,
				(err, customer) =>
				{
					if (err)
					{
						return toss.err(rs, err)
					}

					subscription.discount = customer.discount
					subscription.subscription = customer.subscriptions.data[0]
					toss(rs, subscription)
				}
			)
		})
		.catch(toss.err(rs))
	})

	subscr.express.post('/deactivate', authRequired, (rq, rs) =>
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

	subscr.express.post('/listen', (rq, rs) =>
	{
		subscr.model.stripe.events.retrieve(
			rq.body.id,
			(err, event) =>
			{
				if (err)
				{
					return toss.err(rs, err)
				}

				if (event.type === 'invoice.payment_succeeded')
				{
					var next_period_end = event.data.object.lines.data[0].period.end
					var subscription_id = event.data.object.subscription

					toss(rs, subscr.model
						.extendSubscription(subscription_id, next_period_end))
				}
			}
		)
	})

	return subscr
}

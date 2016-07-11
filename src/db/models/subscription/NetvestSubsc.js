
var SubscrManager = require('./SubscrManager')
var PromoCode    = require('./PromoCode')

var Err = require('../../../Err')

var curry = require('lodash/curry')

module.exports = function NetvestSubsc (db)
{
	var OnlyOnceActivate = Err('only_once_activate', 'Subscription can be activated only once')

	var once_activate = curry((type, user_id, subscr_table) =>
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

	var netvest_subscr  = SubscrManager(db,
	{
		premium:
		{
			features: ['multiple_investors'],
			fn: () => Promise.resolve()
		},
		trial:
		{
			days: 30,
			features: ['multiple_investors'],
			fn: once_activate('trial')
		}
	})

	var promo = PromoCode(db)

	netvest_subscr.enterPromo = function (code, user_id)
	{
		return promo.isValid(code)
		.then((item) =>
		{
			return netvest_subscr.activate(item.type, user_id)
		})
		.then(() =>
		{
			return promo.decrement(code)
		})
	}

	return netvest_subscr
}

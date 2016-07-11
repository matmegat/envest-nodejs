
var SubscrManager = require('./SubscrManager')
var PromoCode    = require('./PromoCode')

var Err = require('../../../Err')

module.exports = function NetvestSubsc (db)
{
	var netvest_subscr  = SubscrManager(db,
	{
		premium:
		{
			features: ['multiple_investors'],
			fn:  new Promise(rs => rs())
		},
		trial:
		{
			days: 30,
			features: ['multiple_investors'],
			fn: once_activate
		}
	})

	var promo = PromoCode(db)

	netvest_subscr.code = function (code, user_id)
	{
		return promo.isValid(code)
		.then((item) =>
		{
			netvest_subscr.activate(item.type, user_id)
		})
	}

	var OnlyOnceActivate = Err('only_once_activate', 'Subscription can be activated only once')

	function once_activate (user_id, type, subscr_table)
	{
		return by_user_id_type(user_id, type, subscr_table)
		.then((items) =>
		{
			if (items.length > 1)
			{
				throw OnlyOnceActivate({ type: type })
			}
		})
	}

	function by_user_id_type (user_id, type, subscr_table)
	{
		return subscr_table()
		.where('user_id', user_id)
		.andWhere('type', type)
	}

	return netvest_subscr
}

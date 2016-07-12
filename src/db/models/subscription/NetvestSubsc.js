
var SubscrManager = require('./SubscrManager')
var PromoCode    = require('./PromoCode')

var knexed = require('../../knexed')

var Err = require('../../../Err')

var curry = require('lodash/curry')

module.exports = function NetvestSubsc (db, cfg)
{
	var knex = db.knex

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

	netvest_subscr.enterPromo = knexed.transact(knex, (trx, code, user_id) =>
	{
		return promo.isValid(code, trx)
		.then((item) =>
		{
			return netvest_subscr.activate(user_id, item.type, trx)
		})
		.then(() =>
		{
			return promo.decrement(code, trx)
		})
	})

	var WrongToken = Err('wrong_subscr_token', 'Wrong subscription token')

	netvest_subscr.buyActivation = function (option)
	{
		if (option.token === cfg.token)
		{
			return netvest_subscr.activate(option.user_id, option.type, option.days)
		}
		else
		{
			throw WrongToken()
		}
	}

	return netvest_subscr
}

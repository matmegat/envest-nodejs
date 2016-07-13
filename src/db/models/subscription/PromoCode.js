var knexed = require('../../knexed')

var moment = require('moment')

var validate    = require('../../validate')
var isPositive  = validate.integer.positive
var validate_time = validate.time

var expect = require('chai').expect

var Err = require('../../../Err')

module.exports = function Promo (db)
{
	var promo = {}

	var knex = db.knex
	var one = db.helpers.one

	promo.table = knexed(knex, 'promo_codes')

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var PromoCreateA = Emitter('promo_create', { group: 'admins' })

	promo.create = function (type, code, end_time, activations)
	{
		var end_time = moment(end_time)

		return new Promise(rs =>
		{
			if (activations)
			{
				isPositive('activations', activations)
			}

			if (end_time)
			{
				validate_time(end_time, 'promo_code')
			}

			return rs()
		})
		.then(() =>
		{
			promo.table()
			.insert(
			{
				type: type,
				end_time: end_time,
				activations: activations,
				code: code.toLowerCase()
			}, 'id')
			.then(one)
		})
		.then(() =>
		{
			PromoCreateA(
			{
				type: type,
				code: code,
				end_time: end_time,
				activations: activations
			})
		})
	}

	var WrongPromoCode = Err('wrong_promo_code', 'Wrong promo code')

	promo.isValid = function (code, trx)
	{
		return promo.table(trx)
		.where(function ()
		{
			this.where('end_time', '>', moment())
			this.whereNotNull('end_time')
		})
		.where(function ()
		{
			this.where('activations', '>', 0)
			this.whereNotNull('activations')
		})
		.where('code', code)
		.then(Err.emptish(WrongPromoCode))
	}

	promo.decrement = function (code)
	{
		return promo.table()
		.where('code', code.toLowerCase())
		.whereNotNull('activations')
		.decrement('activations', 1)
	}

	return promo
}

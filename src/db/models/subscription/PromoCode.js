
var knexed = require('../../knexed')

var moment = require('moment')

var validate    = require('../../validate')
var isPositive  = validate.integer.positive
var validate_date = validate.date

var validateId = require('../../../id').validate.promise

var expect = require('chai').expect
var noop = require('lodash/noop')

var Err = require('../../../Err')

var Filter = require('../../Filter')
var Sorter = require('../../Sorter')

module.exports = function Promo (db)
{
	var promo = {}

	var knex = db.knex
	var one = db.helpers.one

	promo.table = knexed(knex, 'promo_codes')

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var PromoCreateA = Emitter('promo_create', { group: 'admins' })

	var sorter = Sorter(
	{
		order_column: 'end_time',
		allowed_columns: ['end_time', 'activations', 'type', 'code']
	})

	var filter = Filter(
	{
		type: Filter.by.equal('type')
	})

	promo.create = function (type, code, end_time, activations)
	{
		return new Promise(rs =>
		{
			if (activations)
			{
				isPositive('activations', activations)
			}

			if (end_time)
			{
				end_time = moment(end_time)
				validate_date(end_time)
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

	var WrongPromoId = Err('wrong_promo_id', 'Wrong promocode id')

	promo.remove = function (id)
	{
		return validateId(WrongPromoId, id)
		.then(() =>
		{
			return promo.table()
			.where('id', id)
			.del()
			.then(noop)
		})
	}

	promo.list = function (options)
	{
		var queryset = promo.table()

		queryset = filter(queryset, options.filter)

		queryset = sorter.sort(queryset, options.sorter)

		return queryset
	}

	var WrongPromoCode = Err('wrong_promo_code', 'Wrong promo code')

	promo.isValid = function (code, trx)
	{
		return promo.table(trx)
		.where(function ()
		{
			this.where('end_time', '>', moment())
		})
		.where(function ()
		{
			this.where('activations', '>', 0)
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

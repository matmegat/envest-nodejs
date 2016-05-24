var _ = require('lodash')

var Paginator = require('../Paginator')

var Err = require('../../Err')
var NotFound = Err('not_found', 'Feed Item not found')
var helpers = require('../helpers')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	var paginator = Paginator()

	investor.table = () => knex('investors')

	investor.byId = function (id)
	{
		return helpers
		.validate_id(id)
		.then(() =>
		{
			return investor
			.table()
			.where('id', id)
		})
		.then(Err.nullish(NotFound))
		.then(oneMaybe)
	}

	investor.list = function (options) {
		options = _.extend({}, options,
		{
			limit: 20
		})

		return paginator
		.paginate(investor.table(), options)
		.then((investors) =>
		{
			investors.forEach((investor) =>
			{
				investor.full_name = investor.first_name + ' ' + investor.last_name
				investor.annual_return = _.sumBy(
					investor.historical_returns,
					'percentage'
				)

				delete investor.user_id
				delete investor.first_name
				delete investor.last_name
				delete investor.cover_image
				delete investor.profession
				delete investor.background
				delete investor.historical_returns
			})

			return investors
		})
	}
}

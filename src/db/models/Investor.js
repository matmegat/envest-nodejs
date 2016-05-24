var _ = require('lodash')

var Err = require('../../Err')
var NotFound = Err('not_found', 'Feed Item not found')
var helpers = require('../helpers')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	investor.table = () => knex('investors')

	investor.byId = function (id)
	{
		return helpers
		.validate_id(id)
		.then(() =>
		{
			return investor
			.table()
			.where('user_id', id)
		})
		.then(Err.nullish(NotFound))
		.then(oneMaybe)
	}

	investor.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20
		})

		return investor.table()
		.orderBy('last_name', 'asc')
		.orderBy('first_name', 'asc')
		.then((investors) =>
		{
			return investors.map((investor) =>
			{
				investor.id = investor.user_id
				investor.full_name = investor.first_name + ' ' + investor.last_name
				investor.annual_return = _.sumBy(
					investor.historical_returns,
					'percentage'
				) / investor.historical_returns.length
				// FIXME: refactor annual return when it comes more complecated

				return _.pick(investor,
				[
					'id',
					'full_name',
					'icon',
					'focus',
					'annual_return'
				])
			})
		})
	}

	return investor
}

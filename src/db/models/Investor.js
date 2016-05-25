var _ = require('lodash')

var Err = require('../../Err')
var NotFound = Err('not_found', 'Feed Item not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')
var validateId = require('../../id').validate

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	investor.table = () => knex('investors')

	function validate_id (id)
	{
		return new Promise(rs =>
		{
			return rs(validateId(id, WrongInvestorId))
		})
	}

	investor.byId = function (id)
	{
		return validate_id(id)
		.then(() =>
		{
			return investor
			.table()
			.where('user_id', id)
		})
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
		.then((investor) =>
		{
			investor.id = investor.user_id
			investor.full_name = investor.first_name + ' ' + investor.last_name
			investor.annual_return = _.sumBy(
				investor.historical_returns,
				'percentage'
			) / investor.historical_returns.length
			// FIXME: refactor annual return when it comes more complecated

			return _.omit(investor, [ 'user_id', 'first_name', 'last_name', 'historical_returns', 'is_public' ])
		})
	}

	investor.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20
		})

		var queryset = investor.table()
		.orderBy('last_name', 'asc')
		.orderBy('first_name', 'asc')

		if (options.where)
		{
			// TODO: validate options.where
			queryset
			.where(
				options.where.column_name,
				options.where.clause,
				options.where.argument
			)
		}

		return queryset
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

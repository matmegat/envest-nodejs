var _ = require('lodash')

var Err = require('../../Err')
var NotFound = Err('not_found', 'Investor not found')
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
			.select(
				'users.id',
				'users.full_name',
				'users.pic',
				'investors.profession',
				'investors.focus',
				'investors.background',
				'investors.historical_returns',
				'investors.profile_pic'
			)
			.innerJoin('users', 'investors.user_id', 'users.id')
			.where('user_id', id)
		})
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
		.then((investor) =>
		{
			investor.annual_return = _.sumBy(
				investor.historical_returns,
				'percentage'
			) / investor.historical_returns.length
			// FIXME: refactor annual return when it comes more complicated

			return _.omit(investor, [ 'historical_returns' ])
		})
	}

	investor.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20
		})

		var queryset = investor.table()
		.select(
			'users.id',
			'users.full_name',
			'users.pic',
			'investors.focus',
			'investors.historical_returns'
		)
		.innerJoin('users', 'investors.user_id', 'users.id')

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
				investor.annual_return = _.sumBy(
					investor.historical_returns,
					'percentage'
				) / investor.historical_returns.length
				// FIXME: refactor annual return when it comes more complecated

				return _.pick(investor,
				[
					'id',
					'full_name',
					'pic',
					'focus',
					'annual_return'
				])
			})
		})
	}

	return investor
}

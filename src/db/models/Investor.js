var _ = require('lodash')

var Err = require('../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')

var Paginator = require('../Paginator')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	var paginator = Paginator()

	investor.table = () => knex('investors')

	investor.byId = function (id)
	{
		return validate_id(id)
		.then(() =>
		{
			return investor
			.table()
			.select(
				'users.id',
				'users.first_name',
				'users.last_name',
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
			// FIXME: refactor annual return when it comes more complecated

			return _.omit(investor, [ 'historical_returns' ])
		})
	}

	var validate_id = require('../../id').validate.promise(WrongInvestorId)

	investor.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20,
			column_name: 'investors.user_id'
		})

		var queryset = investor.table()
		.select(
			'users.id',
			'users.first_name',
			'users.last_name',
			'users.pic',
			'investors.focus',
			'investors.historical_returns'
		)
		.innerJoin('users', 'investors.user_id', 'users.id')

		queryset = paginator.paginate(queryset, options)

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
				// FIXME: refactor annual return when it comes more complicated

				return _.pick(investor,
				[
					'id',
					'first_name',
					'last_name',
					'pic',
					'focus',
					'annual_return'
				])
			})
		})
	}

	return investor
}

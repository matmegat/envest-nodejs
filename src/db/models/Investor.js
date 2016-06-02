var _ = require('lodash')

var Err = require('../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')
var validateId = require('../../id').validate

var Paginator = require('../paginator/Chunked')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	investor.table = () => knex('investors')

	var paging_table = function ()
	{
		return investor.table()
		.select(
			'user_id',
			'users.full_name'
		)
		.innerJoin('users', 'investors.user_id', 'users.id')
	}
	var paginator = Paginator(
	{
		table: paging_table,
		order_column: 'user_id',
		real_order_column: 'full_name',
		default_direction: 'asc'
	})

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
			// FIXME: refactor annual return when it comes more complecated

			return _.omit(investor, [ 'historical_returns' ])
		})
	}

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

		// if (options.max_id)
		// {
		// 	paging_queryset = paging_queryset
		// 	.where('user_id', options.max_id)
        //
		// 	queryset = queryset
		// 	.where('full_name', '>=', paging_queryset)
		// 	.orderBy('full_name', 'asc')
		// }
		// else if (options.since_id)
		// {
		// 	paging_queryset = paging_queryset
		// 	.where('user_id', options.since_id)
        //
		// 	queryset = queryset
		// 	.where('full_name', '<', paging_queryset)
		// 	.orderBy('full_name', 'desc')
		// }
		// else
		// {
		// 	queryset = queryset.orderBy('full_name', 'asc')
		// }

		return paginator.paginate(queryset, _.omit(options, [ 'where' ]))
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

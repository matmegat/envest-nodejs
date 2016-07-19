
var _ = require('lodash')
var expect = require('chai').expect

var helpers = require('../../helpers')

var Err = require('../../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')

var ChunkedPaginator = require('../../paginator/Chunked')
var BookedPaginator = require('../../paginator/Booked')

var Filter = require('../../Filter')

module.exports = function Meta (knexed_table, options)
{
	expect(knexed_table, 'meta table relation').a('function')

	options = _.extend({}, options)
	var table = function (trx)
	{
		return knexed_table(trx).where(options)
	}

	var meta = {}

	meta.NotFound = NotFound
	meta.WrongInvestorId = WrongInvestorId

	var filter = Filter({
		symbol: Filter.by.portfolio_symbol('investors.user_id'),
		symbols: Filter.by.portfolio_symbols('investors.user_id')
	})

	meta.is = function (id, trx)
	{
		return validate_id(id)
		.then(() =>
		{
			return table(trx)
			.where('user_id', id)
			.then(helpers.oneMaybe)
			.then(Boolean)
		})
	}

	var validate_id = require('../../../id')
	.validate.promise(WrongInvestorId)

	meta.ensure = function (id, trx)
	{
		return meta.is(id, trx)
		.then(Err.falsy(NotFound))
	}

	meta.byId = function (id, trx)
	{
		return meta.ensure(id, trx)
		.then(() =>
		{
			return table(trx)
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
		.then(helpers.oneMaybe)
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

	var paging_table = function (trx)
	{
		return table(trx)
		.select(
			'user_id',
			'users.first_name',
			'users.last_name'
		)
		.innerJoin('users', 'investors.user_id', 'users.id')
	}

	var paginator_chunked = ChunkedPaginator(
	{
		table: paging_table,
		order_column: 'user_id',
		real_order_column: 'last_name',
		default_direction: 'asc'
	})
	var paginator_booked = BookedPaginator(
	{
		order_column: 'last_name',
		default_direction: 'asc'
	})

	meta.list = function (options, trx)
	{
		options = _.extend({}, options,
		{
			limit: 20,
			column_name: 'investors.user_id'
		})

		var queryset = table(trx)
		.innerJoin('users', 'investors.user_id', 'users.id')

		/* begin of all where clauses */
		if (options.where)
		{
			// TODO: validate options.where

			// WHAT with this?
			queryset.where(
				options.where.column_name,
				options.where.clause,
				options.where.argument
			)
		}

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()
		/* end of all where clauses */

		queryset
		.select(
			'users.id',
			'users.first_name',
			'users.last_name',
			'users.pic',
			'investors.focus',
			'investors.historical_returns',
			'investors.profile_pic'
		)

		var paginator
		if (options.page)
		{
			paginator = paginator_booked
		}
		else
		{
			paginator = paginator_chunked
		}

		return paginator.paginate(queryset, _.omit(options, [ 'where' ]))
		.then((investors) =>
		{
			var response =
			{
				investors: investors.map(transform_investor)
			}

			return helpers.count(count_queryset)
			.then((count) =>
			{
				return paginator.total(response, count)
			})
		})
	}

	function transform_investor (investor)
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
			'profile_pic',
			'focus',
			'annual_return'
		])
	}

	return meta
}



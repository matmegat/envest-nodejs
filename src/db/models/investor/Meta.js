
var _ = require('lodash')
var map = _.map
var curry = _.curry

var expect = require('chai').expect

var helpers = require('../../helpers')

var Err = require('../../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')

var ChunkedPaginator = require('../../paginator/Chunked')
var BookedPaginator = require('../../paginator/Booked')

var Filter = require('../../Filter')

module.exports = function Meta (investor, raw, options)
{
	var knexed_table = investor.table

	expect(knexed_table, 'meta table relation').a('function')

	options = _.extend({}, options)

	var table = function (trx)
	{
		return knexed_table(trx).where(options)
	}

	var public_field
	if (! options.is_public)
	{
		public_field = 'is_public'
	}

	var meta = {}

	meta.NotFound = NotFound
	meta.WrongInvestorId = WrongInvestorId

	var filter = Filter({
		ids: Filter.by.ids('user_id'),
		symbols: Filter.by.portfolio_symbols('investors.user_id'),
		is_public: Filter.by.field('is_public')
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


	var fields =
	[
		'users.id',
		'users.first_name',
		'users.last_name',
		'users.pic',
		'investors.profile_pic',
		'investors.profession',
		'investors.focus',
		'investors.education',
		'investors.background',
		'investors.historical_returns',
		raw(`
			(SELECT * FROM featured_investor
			WHERE investor_id = users.id)
			IS NOT NULL AS is_featured`
		)
	]

	var byId = meta.byId = function (id, trx)
	{
		return meta.ensure(id, trx)
		.then(() =>
		{
			return table(trx)
			.select(fields)
			.select(public_field)
			.innerJoin('users', 'investors.user_id', 'users.id')
			.where('user_id', id)
		})
		.then(transform_investors(trx))
		.then(helpers.oneMaybe)
	}

	meta.fullById = byId

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

	meta.list = function (options)
	{
		var queryset = table()
		.innerJoin('users', 'investors.user_id', 'users.id')

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()

		queryset
		.select(fields)
		.select(public_field)

		var paginator
		if (options.paginator && options.paginator.page)
		{
			paginator = paginator_booked
		}
		else
		{
			paginator = paginator_chunked
		}

		return paginator.paginate(queryset, options.paginator)
		.then(transform_investors(null))
		.then((investors) =>
		{
			var response =
			{
				investors: investors
			}

			return helpers.count(count_queryset)
			.then((count) =>
			{
				return paginator.total(response, count)
			})
		})
	}

	var transform_investors = curry((trx, investors) =>
	{
		var ids = map(investors, 'id')

		// ugly fix
		if (trx)
		{
			var gains = map(ids, id => investor.portfolio.gain(trx, id))
		}
		else
		{
			var gains = map(ids, id => investor.portfolio.gain(id))
		}
		var gains = Promise.all(gains)

		return gains
		.then(gains =>
		{
			investors.forEach((investor, i) =>
			{
				investor.gain = gains[i]
			})

			return investors
		})
	})

	return meta
}



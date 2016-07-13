var _ = require('lodash')

var knexed = require('../knexed')

var Err = require('../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')

var Paginator = require('../paginator/Chunked')
var Filter = require('../Filter')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex

	var one = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	investor.table = knexed(
		knex,
		knex.raw(
			'(' +
				'SELECT * ' +
				'FROM investors ' +
				'WHERE is_public = TRUE' +
			') AS investors'
		)
	)

	investor.WrongInvestorId = WrongInvestorId

	var paging_table = function (trx)
	{
		return investor.table(trx)
		.select(
			'user_id',
			'users.first_name',
			'users.last_name'
		)
		.innerJoin('users', 'investors.user_id', 'users.id')
	}
	var paginator = Paginator(
	{
		table: paging_table,
		order_column: 'user_id',
		real_order_column: 'last_name',
		default_direction: 'asc'
	})

	var filter = Filter({
		symbol: Filter.by.symbol('investors.user_id')
	})

	investor.is = function (investor_id, trx)
	{
		return investor.byId(investor_id, trx)
		.then(Boolean)
	}

	investor.ensure = function (investor_id, trx)
	{
		return investor.is(investor_id, trx)
		.then(Err.falsy(WrongInvestorId))
	}

	investor.byId = function (id, trx)
	{
		return investor.validateId(id)
		.then(() =>
		{
			return investor
			.table(trx)
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

	investor.validateId = require('../../id').validate.promise(WrongInvestorId)

	investor.list = function (options, trx)
	{
		options.paginator = _.extend({}, options.paginator,
		{
			limit: 20,
			column_name: 'investors.user_id'
		})

		var queryset = investor.table(trx)

		queryset = filter(queryset, options.filter)

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

		console.log(queryset.toString())

		return paginator.paginate(queryset, options.paginator)
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
					'profile_pic',
					'focus',
					'annual_return'
				])
			})
		})
	}

	/*TODO: deal with second table*/
	var investor_table = knexed(knex, 'investors')

	var get_pic = require('lodash/fp/get')('profile_pic')

	investor.profilePicById = function (user_id)
	{
		return investor_table()
		.where('user_id', user_id)
		.then(one)
		.then(get_pic)
	}

	investor.updateProfilePic = function (data)
	{
		return investor_table()
		.update({
			profile_pic: data.hash
		})
		.where('user_id', data.user_id)
	}

	return investor
}

var _ = require('lodash')
var generate_code = require('../../crypto-helpers').generate_code
var knexed = require('../knexed')

var Err = require('../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')
var AlreadyExists = Err('already_investor', 'This user is investor already')

var expect = require('chai').expect
var validate = require('../validate')

var Paginator = require('../paginator/Chunked')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	investor.table = knexed(knex, 'investors')

	var auth = db.auth
	expect(db, 'Investors depends on Auth').property('auth')
	var user = db.user

	var paging_table = function ()
	{
		return investor.table()
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

	investor.byId = function (id, trx)
	{
		return investor.validate_id(id, trx)
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

	investor.validate_id = require('../../id').validate.promise(WrongInvestorId)

	investor.list = function (options, trx)
	{
		options = _.extend({}, options,
		{
			limit: 20,
			column_name: 'investors.user_id'
		})

		var queryset = investor
        .table(trx)
		.select(
			'users.id',
			'users.first_name',
			'users.last_name',
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
					'first_name',
					'last_name',
					'pic',
					'focus',
					'annual_return'
				])
			})
		})
	}

	investor.create = knexed.transact(knex, (trx, data) =>
	{
		return new Promise((resolve) =>
		{
			validate.required(data.first_name, 'first_name')
			validate.required(data.last_name, 'last_name')
			validate.required(data.email, 'email')
			resolve()
		})
		.then(() =>
		{
			return generate_code()
		})
		.then((password) =>
		{
			var user_data = _.extend({}, data,
			{
				password: password	/* new Investor should reset his password */
			})

			return auth.register(user_data)
		})
		.then(() =>
		{
			return user.byEmail(data.email, trx)
		})
		.then((user) =>
		{
			return investor
            .table(trx)
			.insert(
			{
				user_id: user.id,
				historical_returns: []
			}, 'user_id')
			.catch(Err.fromDb('investors_pkey', AlreadyExists))
		})
		.then(oneMaybe)
		.then((investor_id) =>
		{
			// TODO: sent welcome email
			return investor.byId(investor_id, trx)
		})
	})

	// investor.update = knexed.transact(knex, (trx, id, data) =>
	// {
	//
	// })

	return investor
}

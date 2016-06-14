var _ = require('lodash')

var generate_code = require('../../../crypto-helpers').generate_code

var knexed = require('../../knexed')

var Err = require('../../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')
var AlreadyExists = Err('already_investor', 'This user is investor already')

var expect = require('chai').expect
var validate = require('../../validate')

var Onboarding = require('./Onboarding')

var Paginator = require('../../paginator/Chunked')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe

	investor.table = knexed(knex, 'investors')

	investor.table_public = (trx) =>
	{
		return investor.table(trx)
		.where('is_public', true)
	}

	expect(db, 'Investors depends on Auth').property('auth')
	var auth = db.auth

	expect(db, 'Investors depends on User').property('user')
	var user = db.user

	investor.onboarding = Onboarding(db, investor)

	var paging_table = function (trx)
	{
		return investor.table_public(trx)
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
		return validate_id(id)
		.then(() =>
		{
			return investor
			.table_public(trx)
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

	var validate_id = require('../../../id')
	.validate.promise(WrongInvestorId)

	investor.list = function (options, trx)
	{
		options = _.extend({}, options,
		{
			limit: 20,
			column_name: 'investors.user_id'
		})

		var queryset = investor.table_public(trx)
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

			// WHAT with this?
			queryset.where(
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
					'profile_pic',
					'focus',
					'annual_return'
				])
			})
		})
	}

	investor.create = knexed.transact(knex, (trx, data) =>
	{
		return new Promise(rs =>
		{
			validate.required(data.first_name, 'first_name')
			validate.required(data.last_name, 'last_name')
			validate.required(data.email, 'email')

			rs()
		})
		.then(() =>
		{
			return generate_code()
		})
		.then((password) =>
		{
			var user_data = _.extend({}, data,
			{
				password: password /* new Investor should reset his password */
			})

			return auth.register(user_data)
		})
		.then(() =>
		{
			return user.byEmail(data.email, trx)
		})
		.then((user) =>
		{
			return investor.table_public(trx)
			.insert(
			{
				user_id: user.id,
				historical_returns: []
			}
			, 'user_id')
			.catch(Err.fromDb('investors_pkey', AlreadyExists))
		})
		.then(oneMaybe)
		.then((investor_id) =>
		{
			/* TODO: sent welcome email
			* - email verification link: ...
			* - link to 'set new password'
			* */
			/* TODO: add notification: 'investor created'
			* - to all admins?
			* - to parent admin?
			* - to created investor?
			* */
			return investor.byId(investor_id, trx)
		})
	})

	return investor
}

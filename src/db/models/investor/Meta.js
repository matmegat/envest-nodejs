
var _ = require('lodash')
var expect = require('chai').expect

var helpers = require('../../helpers')

var Err = require('../../../Err')
var NotFound = Err('investor_not_found', 'Investor not found')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id')


module.exports = function Meta (knexed_table, options)
{
	expect(knexed_table, 'meta table relation').a('function')

	options = _.extend({}, options)
	var table = function (trx)
	{
		return knexed_table(trx).where(options)
	}

	var meta = {}

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

	meta.list = function (options, trx) {}


	return meta
}




var expect = require('chai').expect

var _ = require('lodash')

var knexed = require('../knexed')

var Err = require('../../Err')
var WrongInvestorId = Err('wrong_investor_id', 'Wrong investor id')

module.exports = function Portfolio (db)
{
	var portfolio = {}

	var knex     = db.knex
	var oneMaybe = db.helpers.oneMaybe

	portfolio.table = knexed(knex, 'portfolio_symbols')

	expect(db, 'Portfolio depends on Investor').property('investor')

	portfolio.list = function (options, trx)
	{
		return db.investor.validate_id(options.investor_id)
		.then(() =>
		{
			return db.investor.table()
			.select('user_id as id')
			.where(
			{
				user_id: options.investor_id,
				is_public: true
			})
		})
		.then(oneMaybe)
		.then(Err.nullish(WrongInvestorId))
		.then((investor) =>
		{
			return portfolio.table(trx)
			.select(
			[
				'amount',
				'symbols.id',
				'symbols.ticker',
				'symbols.company',
				'brokerage.multiplier'
			])
			.where('portfolio_symbols.investor_id', investor.id)
			.innerJoin('symbols', 'portfolio_symbols.symbol_id', 'symbols.id')
			.innerJoin(
				'brokerage',
				'portfolio_symbols.investor_id',
				'brokerage.investor_id'
			)
		})
		.then((portfolio_holdings) =>
		{
			portfolio_holdings = portfolio_holdings.map((portfolio_holding) =>
			{
				var random_price = _.random(50.0, 150.0, true)
				portfolio_holding.allocation =
					portfolio_holding.amount *
					random_price *
					portfolio_holding.multiplier

				portfolio_holding.gain = _.random(-10.0, 10.0, true)
				portfolio_holding.symbol = _.pick(portfolio_holding,
				[
					'id',
					'ticker',
					'company'
				])

				return _.pick(portfolio_holding,
				[
					'symbol',
					'allocation',
					'gain'
				])
			})

			return {
				total: portfolio_holdings.length,
				holdings: _.orderBy(portfolio_holdings, 'allocation', 'desc')
			}
		})
	}

	return portfolio
}

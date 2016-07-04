var knexed = require('../../../knexed')

var _ = require('lodash')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var knex    = db.knex
	// var helpers = db.helpers

	portfolio.holdings_table = knexed(knex, 'portfolio_symbols')

	var brokerage = Brokerage(db, investor)
	var holdings  = Holdings(db, investor)

	portfolio.list = function (investor_id, trx)
	{
		return investor.public.ensure(investor_id, trx)
		.then(() =>
		{
			return Promise.all([
				holdings.byInvestorId(investor_id),
				brokerage.byInvestorId(investor_id)
			])
		})
		.then((values) =>
		{
			var portfolio_holdings = values[0]
			var brokerage = values[1]

			portfolio_holdings = portfolio_holdings.map((portfolio_holding) =>
			{
				portfolio_holding.allocation =
					portfolio_holding.amount *
					portfolio_holding.buy_price *
					brokerage.multiplier

				portfolio_holding.gain = _.random(-10.0, 10.0, true)
				// TODO: request to XIgnite
				portfolio_holding.symbol =
				{
					exchange: portfolio_holding.symbol_exchange,
					ticker: portfolio_holding.symbol_ticker,
					company: 'TODO: request XIgnite'
				}

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

	portfolio.recalculate = function (investor_id)
	{
		return Promise.all([
			brokerage.byInvestorId(investor_id),
			holdings.byInvestorId(investor_id)
		])
		.then((values) =>
		{
			var brokerage_entry = values[0]
			var holding_entries = values[1]

			var indexed_amount = 100000
			var real_allocation = Number(brokerage_entry.cash_value)

			holding_entries.forEach((holding) =>
			{
				real_allocation += holding.amount * holding.buy_price
			})

			var multiplier = indexed_amount / real_allocation

			return brokerage.set(investor_id,
			{
				cash_value: Number(brokerage_entry.cash_value),
				multiplier: multiplier
			})
		})
	}

	portfolio.setHoldings = function (investor_id, holding_entries)
	{
		return holdings.set(investor_id, holding_entries)
		.then(() =>
		{
			return portfolio.recalculate(investor_id)
		})
	}

	portfolio.setBrokerage = function (investor_id, amount)
	{
		return brokerage.set(investor_id, { cash_value: amount })
		.then(() =>
		{
			return portfolio.recalculate(investor_id)
		})
	}

	portfolio.createBrokerage = function (trx, investor_id, amount)
	{
		return brokerage.table(trx)
		.insert(
		{
			investor_id: investor_id,
			cash_value: amount,
			multiplier: 1.0
		})
	}

	return portfolio
}

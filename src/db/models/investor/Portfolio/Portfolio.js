var knexed = require('../../../knexed')

var _ = require('lodash')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

var Err = require('../../../../Err')

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

			portfolio_holdings.forEach((portfolio_holding) =>
			{
				portfolio_holding.allocation =
					portfolio_holding.amount *
					portfolio_holding.buy_price *
					brokerage.multiplier
			})

			return db.symbols.quotes(portfolio_holdings.map((holding) =>
			{
				return [ holding.symbol_ticker, holding.symbol_exchange ]
			}))
			.then((quoted_symbols) =>
			{
				portfolio_holdings = quoted_symbols.map((quoted_symbol, i) =>
				{
					if (quoted_symbol === null)
					{
						portfolio_holdings[i].symbol =
						{
							ticker: portfolio_holdings[i].symbol_ticker,
							exchange: portfolio_holdings[i].symbol_exchange,
							company: null
						}
						portfolio_holdings[i].gain = null
					}
					else
					{
						portfolio_holdings[i].symbol = quoted_symbol.symbol
						portfolio_holdings[i].gain = /* calculated percentage */
							( quoted_symbol.price /
							portfolio_holdings[i].buy_price - 1 ) * 100
					}

					return _.pick(portfolio_holdings[i],
					[
						'symbol',
						'allocation',
						'gain'
					])
				})

				return {
					total: portfolio_holdings.length,
					holdings: _.orderBy(portfolio_holdings, 'allocation', 'desc'),
					full_portfolio:
					{
						value: brokerage.cash_value
						       * brokerage.multiplier
						       + _.sumBy(portfolio_holdings, 'allocation'),
						gain: _.sumBy(portfolio_holdings, 'gain')
						      / portfolio_holdings.length
					}
				}
			})
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

	var WrongTradeDir = Err('wrong_trade_dir', 'Wrong Trade Dir')

	holdings.dirs = {}
	holdings.dirs.bought = holdings.buy
	holdings.dirs.sold = holdings.sell

	portfolio.updateBrokerage = function (trx, investor_id, type, date, data)
	{
		var dir = data.dir
		var symbol = data.symbol.split('.')
		var ticker = symbol[0]
		var exchange = symbol[1]

		symbol =
		{
			symbol_exchange: exchange,
			symbol_ticker: ticker
		}

		if (! (dir in holdings.dirs))
		{
			throw WrongTradeDir({ dir: dir })
		}

		return brokerage.byInvestorId(investor_id)
		.then(resl =>
		{
			var cash = resl.cash_value

			return holdings.dirs[dir](trx, investor_id, symbol, data, cash)
		})
		.then(sum =>
		{
			return sum
		})
	}

	portfolio.full = function (investor_id)
	{
		return investor.all.ensure(investor_id)
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
				portfolio_holding.buy_price = Number(portfolio_holding.buy_price)

				portfolio_holding.allocation =
					portfolio_holding.amount *
					portfolio_holding.buy_price *
					brokerage.multiplier

				portfolio_holding.symbol =
				{
					ticker: portfolio_holding.symbol_ticker,
					exchange: portfolio_holding.symbol_exchange,
					company: null
				}

				return _.omit(
					portfolio_holding,
					[ 'symbol_ticker', 'symbol_exchange' ]
				)
			})

			return {
				brokerage: brokerage,
				holdings:  portfolio_holdings
			}
		})
	}

	return portfolio
}

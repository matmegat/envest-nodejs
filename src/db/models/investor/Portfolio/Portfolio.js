
var _ = require('lodash')
var sumBy = require('lodash/sumBy')

var knexed = require('../../../knexed')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

var Symbl = require('../../symbols/Symbl')

var Err = require('../../../../Err')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var brokerage = Brokerage(db, investor, portfolio)
	var holdings  = Holdings(db, investor, portfolio)

	var knex = db.knex

	portfolio.byId = function (investor_id, trx)
	{
		return investor.public.ensure(investor_id, trx)
		.then(() =>
		{
			return Promise.all([
				brokerage.byId(trx, investor_id),
				 holdings.byId(trx, investor_id)
			])
		})
		.then((values) =>
		{
			var brokerage = values[0]
			var portfolio_holdings = values[1]

			portfolio_holdings.forEach(holding =>
			{
				holding.allocation =
					holding.amount *
					holding.price *
					brokerage.multiplier
			})

			return db.symbols.quotes(portfolio_holdings.map(holding =>
			{
				return [ holding.symbol_ticker, holding.symbol_exchange ]
			}))
			.then((quoted_symbols) =>
			{
				portfolio_holdings = quoted_symbols.map((quoted_symbol, i) =>
				{
					var holding = portfolio_holdings[i]

					if (quoted_symbol == null)
					{
						holding.symbol = Symbl(
						[
							holding.symbol_ticker,
							holding.symbol_exchange
						])
						.toFull()

						holding.gain = null
					}
					else
					{
						holding.symbol = quoted_symbol.symbol

						/* calculated percentage */
						holding.gain
						 = (quoted_symbol.price / holding.price - 1 ) * 100
					}

					return _.pick(holding,
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
						       + sumBy(portfolio_holdings, 'allocation'),
						gain: sumBy(portfolio_holdings, 'gain') /
						       portfolio_holdings.length
					}
				}
			})
		})
	}

	portfolio.full = function (investor_id)
	{
		return investor.all.ensure(investor_id)
		.then(() =>
		{
			return Promise.all([
				brokerage.byId(investor_id),
				 holdings.byId(investor_id)
			])
		})
		.then((values) =>
		{
			var brokerage = values[0]
			var portfolio_holdings = values[1]

			portfolio_holdings = portfolio_holdings.map(holding =>
			{
				holding.allocation =
					holding.amount *
					holding.price *
					brokerage.multiplier

				holding.symbol =
				{
					ticker: holding.symbol_ticker,
					exchange: holding.symbol_exchange,
					company: null
				}

				return _.omit(
					holding,
					[ 'symbol_ticker', 'symbol_exchange' ]
				)
			})

			return {
				brokerage: brokerage,
				holdings:  portfolio_holdings
			}
		})
	}


	var index_amount_cap = 1e5

	portfolio.recalculate = knexed.transact(knex, (trx, investor_id) =>
	{
		return Promise.all(
		[
			brokerage.byId(trx, investor_id),
			 holdings.byId(trx, investor_id)
		])
		.then(values =>
		{
			var brokerage = values[0]
			var holdings  = values[1]

			var cash = brokerage.cash_value

			var real_allocation = cash + sumBy(holdings, h => h.amount * h.price)
			var multiplier = (index_amount_cap / real_allocation)

			return brokerage.set(trx, investor_id,
			{
				cash_value: brokerage.cash,
				multiplier: multiplier
			})
		})
	})


	portfolio.initializeBrokerage = function (trx, investor_id)
	{
		return brokerage.table(trx)
		.insert(
		{
			investor_id: investor_id,
			cash_value:  index_amount_cap,
			multiplier:  1.0
		})
	}


	var WrongTradeDir = Err('wrong_trade_dir', 'Wrong Trade Dir')

	holdings.dirs = {}
	holdings.dirs.bought = holdings.buy
	holdings.dirs.sold = holdings.sell

	portfolio.makeTrade = function (trx, investor_id, type, date, data)
	{
		var dir = data.dir
		var symbol = {}

		return Symbl.validate(data.symbol)
		.then(symbl =>
		{
			symbol = symbl

			if (! (dir in holdings.dirs))
			{
				throw WrongTradeDir({ dir: dir })
			}

			return brokerage.byId(trx, investor_id)
		})
		.then(resl =>
		{
			var cash = resl.cash_value

			return holdings.dirs[dir](trx, investor_id, symbol, data, cash)
		})
		.then(sum =>
		{
			return brokerage.update(trx, investor_id,
			{
				operation: 'trade',
				amount: sum
			})
		})
	}

	return portfolio
}

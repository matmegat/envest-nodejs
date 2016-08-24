
var pick = require('lodash/pick')
var omit = require('lodash/omit')
var sumBy = require('lodash/sumBy')
var orderBy = require('lodash/orderBy')

var knexed = require('../../../knexed')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

var Symbl = require('../../symbols/Symbl')

var Err = require('../../../../Err')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var brokerage = portfolio.brokerage = Brokerage(db, investor, portfolio)
	var holdings  = portfolio.holdings  =  Holdings(db, investor, portfolio)

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
			var holdings  = values[1]

			holdings.forEach(holding =>
			{
				holding.allocation
				 = holding.amount * holding.price * brokerage.multiplier
			})

			return db.symbols.quotes(holdings.map(holding =>
			{
				return [ holding.symbol_ticker, holding.symbol_exchange ]
			}))
			.then((quoted_symbols) =>
			{
				holdings = quoted_symbols.map((quoted_symbol, i) =>
				{
					var holding = holdings[i]

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

					return pick(holding,
					[
						'symbol',
						'allocation',
						'gain'
					])
				})


				var total = holdings.length

				holdings = orderBy(holdings, 'allocation', 'desc')

				/* full = cash + holdings */
				var full_value
				 = brokerage.cash * brokerage.multiplier
				 + sumBy(holdings, 'allocation')

				/* avg gain */
				var gain = sumBy(holdings, 'gain') / total

				return {
					total:    total,
					holdings: holdings,
					full_portfolio:
					{
						value: full_value,
						gain:  gain
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
			var holdings  = values[1]

			holdings = holdings.map(holding =>
			{
				holding.allocation
				 = holding.amount * holding.price * brokerage.multiplier

				holding.symbol =
				{
					ticker: holding.symbol_ticker,
					exchange: holding.symbol_exchange,
					company: null
				}

				return omit(holding, 'symbol_ticker', 'symbol_exchange')
			})

			return {
				brokerage: brokerage,
				holdings:  holdings
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

			var cash = brokerage.cash

			var real_allocation = cash + sumBy(holdings, h => h.amount * h.price)
			var multiplier = (index_amount_cap / real_allocation)

			return brokerage.set(trx, investor_id,
			{
				cash: brokerage.cash,
				multiplier: multiplier
			})
		})
	})


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
			var cash = resl.cash

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

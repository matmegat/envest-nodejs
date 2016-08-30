
var pick = require('lodash/pick')
var omit = require('lodash/omit')
var sumBy = require('lodash/sumBy')
var orderBy = require('lodash/orderBy')
var forOwn = require('lodash/forOwn')
var round = require('lodash/round')

var moment = require('moment')
var MRange = require('moment-range/lib/moment-range')

var expect = require('chai').expect

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

	expect(db, 'Portfolio depends on Series').property('symbols')
	var symbols = db.symbols

	var knex = db.knex

	portfolio.byId = knexed.transact(knex, (trx, investor_id) =>
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
	})

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


	portfolio.grid = knexed.transact(knex, (trx, investor_id) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return Promise.all(
			[
				holdings.grid(trx, investor_id),
				brokerage.grid(trx, investor_id)
			])
		})
		.then(grids =>
		{
			var grid = {}

			grid.holdings  = grids[0]
			grid.brokerage = grids[1]

			var range = max_range(
				grid.brokerage.daterange,
				grid.holdings.daterange
			)

			range = range_from(range, moment())

			return grid_series(grid.holdings.involved, range)
			.then(superseries =>
			{
				if (0)
				{
					console.dir(grid)
					console.log('--- holdings:')
					console.dir(grid.holdings.datadays, 3)
					console.log('--- brokerage:')
					console.dir(grid.brokerage.datadays)
					console.log('--- series:')
					console.dir(superseries, 3)
				}

				var compiled = []

				range.by('days', it =>
				{
					var iso = it.toISOString()

					var c_brokerage
					 = find_brokerage(grid.brokerage.datadays, iso)

					var total = c_brokerage.cash * c_brokerage.multiplier

					var c_holdings
					 = find_holding_day(grid.holdings.datadays, iso)

					if (c_holdings)
					{
						forOwn(c_holdings, holding =>
						{
							var price
							 = find_series_value(superseries, holding.symbol, iso)

							var wealth
							 = price * holding.amount * c_brokerage.multiplier

							total += wealth
						})
					}

					total = round(total, 3)

					compiled.push([ moment(iso).utc().format(), total ])
				})

				return compiled
			})
		})
	})

	// TODO rm
	// portfolio.grid(120)
	// .then(console.dir, console.error)

	function max_range (brokerage, holdings)
	{
		brokerage = new MRange(brokerage)

		if (holdings)
		{
			holdings = new MRange(holdings)
		}

		var start = brokerage.start
		var end   = brokerage.end

		if (holdings && holdings.end.isValid())
		{
			end = moment.max(brokerage.end, holdings.end)
		}

		return new MRange(start, end)
	}

	function range_from (range, end)
	{
		end = moment(end)
		var start = moment(end).subtract(2, 'years')

		start = moment.max(range.start, start)

		return new MRange(start, end)
	}


	function grid_series (involved, range)
	{
		var queries = involved.map(
			symbol => symbols.seriesForPortfolio(symbol, range)
		)

		return Promise.all(queries)
		.then(batch =>
		{
			var r = {}

			batch.forEach((data, i) =>
			{
				var symbol = involved[i]

				r[symbol] = data
			})

			return r
		})
	}

	var findLast = require('lodash/findLast')

	function find_brokerage (brokerage, date)
	{
		/* ISO dates are sortable */
		var entry = findLast(brokerage, entry => entry[0] <= date)

		if (entry)
		{
			return entry[1]
		}
		else
		{
			throw TypeError('brokerage_error')
		}
	}

	function find_holding_day (holdings, date)
	{
		/* ISO dates are sortable */
		var entry = findLast(holdings, entry => entry[0] <= date)

		if (entry)
		{
			return entry[1]
		}
		else
		{
			return null // NO trades at all
		}
	}

	function find_series_value (series, symbol, day)
	{
		series = series[symbol]

		/* ISO dates are sortable */
		var entry = findLast(series, tick =>
		{
			var ts = moment(tick.timestamp).toISOString()
			return ts <= day
		})

		if (entry)
		{
			return entry.value
		}
		else
		{
			console.warn(
				'XIGN error, no data for Investor Chart {%s, %s}',
				symbol, day
			)

			return 0
		}
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

			return holdings.dirs[dir](trx, investor_id, symbol, date, data)
		})
		.then(sum =>
		{
			return brokerage.update(trx, investor_id, date,
			{
				operation: 'trade',
				amount: sum
			})
		})
	}

	return portfolio
}

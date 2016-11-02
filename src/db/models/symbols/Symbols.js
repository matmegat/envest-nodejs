
var expect = require('chai').expect

var Xign = require('./Xign')
var Symbl = require('./Symbl')

var Err = require('../../../Err')

var UnknownSymbol
 = Err('unknown_symbol', 'Symbol cannot be resolved')

var OtherSymbol
 = Err('other_special_symbol_not_allowed', 'OTHER symbol not allowed')

var constant = require('lodash/constant')
var Null = constant(null)

var extend = require('lodash/assign')
var pick = require('lodash/pick')
var omit = require('lodash/omit')
var invoke = require('lodash/invokeMap')
var merge = require('lodash/merge')
var get = require('lodash/get')

var moment = require('moment')

var Symbols = module.exports = function Symbols (db, cfg, log)
{
	var symbols = {}

	var xign = Xign(cfg.xignite, log)

	symbols.resolve = (symbol, options) =>
	{
		options = extend(
		{
			other: false,
		},
		options)

		return Symbl.validate(symbol)
		.then(symbol =>
		{
			if (symbol.isOther())
			{
				if (! options.other)
				{
					throw OtherSymbol()
				}
				else
				{
					return symbol.toFull() /* not full data though */
				}
			}

			return xign.resolve(symbol.toXign())
			.then(resl =>
			{
				var symbol = Symbl(resl.symbol)

				symbol.exchange || (symbol.exchange = resl.exchange)

				symbol = symbol.toFull()

				symbol.company = resl.company

				return symbol
			},
			() =>
			{
				throw UnknownSymbol({ symbol: symbol })
			})
		})
	}

	symbols.resolveMany = (symbols_arr, options) =>
	{
		options = extend(
		{
			soft: false,
			other: false
		},
		options)

		var queries = symbols_arr
		.map(symbol =>
		{
			return symbols.resolve.cache(symbol, pick(options, 'other'))
		})

		if (options.soft)
		{
			queries = queries
			.map(query =>
			{
				return query.catch(Null)
			})
		}

		return Promise.all(queries)
	}

	/* cache-first */
	symbols.resolve.cache = db.cache.regular('resolve',
		{ ttl: 15 * 60 },
		cache_symbol,
		symbols.resolve
	)


	symbols.quotes = (symbol_s, for_date, options) =>
	{
		options = extend(
		{
			soft: false,
			other: false
		},
		options)

		expect(symbol_s).ok

		symbol_s = [].concat(symbol_s)

		symbol_s = symbol_s.map(Symbl)

		var symbol_s_xign = invoke(symbol_s, 'toXign')

		return xign.quotes(symbol_s_xign, for_date)
		.then(resl =>
		{
			return resl.map((r, i) =>
			{
				if (! r) /* not_resolved */
				{
					throw ReferenceError('wrong_scenario')
				}
				else
				{
					return Promise.resolve(symbol_s[i])
					.then(symbol =>
					{
						r = omit(r, 'symbol', 'company')

						r.symbol = symbol

						if (r.price != null)
						{
							return r
						}

						if (symbol.isOther())
						{
							if (! options.other)
							{
								throw OtherSymbol()
							}
						}

						return r
					})
					.then(r =>
					{
						return symbols.resolve.cache(r.symbol)
						.then(symbol =>
						{
							r.symbol = symbol

							return r
						},
						err =>
						{
							if (options.soft)
							{
								return r
							}
							else
							{
								throw err
							}
						})
					})
				}
			})
		})
		.then(it => Promise.all(it)) /* ridiculous wrapper */
	}


	symbols.detail = (symbol) =>
	{
		return Promise.all(
		[
			get_last_fundamentals(symbol),
			xign.quotes([ symbol ]),
		])
		.then(so =>
		{
			return merge(so[0], so[1][0])
		})
	}

	function get_last_fundamentals (symbol)
	{
		var funds =
		{
			market_cap: null,
			dividend: null,
			one_year_low: null,
			one_year_high: null
		}

		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.fundamentals(symbol.toXign())
		})
		.then(resl =>
		{
			var fundamentals = resl.Fundamentals || []
			var obj = {}

			fundamentals.forEach((el) =>
			{
				var prop = el.Type

				obj[prop] = {
					value: el.Value,
					unit: el.Unit
				}
			})

			return obj
		})
		.then(obj =>
		{
			var market_cap = Number(obj.MarketCapitalization.value) || null
			var unit = obj.MarketCapitalization.unit

			if (market_cap && unit === 'Millions')
			{
				market_cap *= 1e6
			}
			else
			{
				market_cap = null
			}

			funds.market_cap = market_cap
			funds.dividend =
				Number(obj.DividendYieldDaily.value) || null
			funds.one_year_low =
				Number(obj.LowPriceLast52Weeks.value) || null
			funds.one_year_high =
				Number(obj.HighPriceLast52Weeks.value) || null

			return funds
		})
		.catch(() =>
		{
			return funds
		})
	}


	symbols.series = (symbol) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			var today = () => moment.utc().startOf('day')
			var allowed_offset = 10

			return Promise.all(
			[
				xign.series.intraday(
					symbol.toXign(),
					today(),
					today().endOf('day')
				),

				get_trading_in_period(symbol, allowed_offset),

				xign.series(
					symbol.toXign(),
					today(),
					today().diff(
						today().subtract(5, 'years'),
						'days'
					)
				),
			])
		})
		.then((values) =>
		{
			var today_points = []
			if (values[0].length)
			{
				today_points = values[0]
			}
			else
			{
				today_points = values[1]
			}

			var utc_offset = get(today_points, '0.utcOffset', null)
			today_points = today_points.map(point => omit(point, 'utcOffset'))

			return [
				{ period: 'today', points: today_points, utcOffset: utc_offset },
				{ period: 'y5', points: values[2] },
			]
		})
	}

	function get_trading_in_period (symbol, days_count)
	{
		var today = moment.utc().startOf('day')

		return xign.lastTradeDate(symbol.toXign())
		.then((date) =>
		{
			if (date === null || today.diff(date, 'days') > days_count)
			{
				return []
			}

			return xign.series.intraday(
				symbol.toXign(),
				date.startOf('day'),
				date.clone().endOf('day')
			)
		})
	}


	var apidate = require('./util').apidate

	symbols.seriesForPortfolio = db.cache.regular('portfolio',
		{ ttl: 60 * 60 },
		(symbol, range) =>
			[ cache_symbol(symbol), apidate(range.start), apidate(range.end) ],
		(symbol, range) =>   xign.seriesRange(symbol, range.start, range.end)
	)

	symbols.seriesForPortfolio.intraday = db.cache.regular('portfolio.intraday',
		{ ttl: 60 * 15 },
		cache_symbol,
		(symbol, range) => xign.series.intraday(symbol, range.start, range.end)
	)

	function cache_symbol (symbol)
	{
		return Symbl(symbol).toXign()
	}

	return symbols
}


Symbols.schema = {}

/*
 * columns('', table)        = { exchange, ticker }
 * columns('symbol_', table) = { symbol_exchange, symbol_ticker } // REF
 */
Symbols.schema.columns = (prefix, table) =>
{
	prefix || (prefix = '')

	table.string(prefix + 'exchange').notNullable()
	table.string(prefix + 'ticker').notNullable()

	return table
}


var expect = require('chai').expect

var Xign = require('./Xign')
var Symbl = require('./Symbl')
var Cache = require('./ResolveCache')

var Err = require('../../../Err')

var UnknownSymbol
 = Err('unknown_symbol', 'Symbol cannot be resolved')

var OtherSymbol
 = Err('other_special_symbol_not_allowed', 'OTHER symbol not allowed')

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

	var cache = Cache()

	var xign = Xign(cfg.xignite, log)

	symbols.resolve = (symbol, options) =>
	{
		options = extend(
		{
			other: false,
			cache: true
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
				var orig_symbol = symbol.clone()

				symbol.exchange || (symbol.exchange = resl.exchange)

				symbol = symbol.toFull()

				symbol.company = resl.company

				return [ orig_symbol, symbol ]
			},
			() =>
			{
				throw UnknownSymbol({ symbol: symbol })
			})
			.then(symbols =>
			{
				var symbol = symbols[1]

				if (options.cache)
				{
					var orig_symbol = symbols[0]

					cache.put(orig_symbol, symbol)
				}

				return symbol
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
				return query.catch(() => null)
			})
		}

		return Promise.all(queries)
	}

	/* cache-first */
	symbols.resolve.cache = (symbol, options) =>
	{
		return new Promise(rs =>
		{
			var data = cache.get(symbol)

			if (data)
			{
				return rs(data)
			}

			return rs(symbols.resolve(symbol, options))
		})
	}


	symbols.quotes = (symbols, for_date, options) =>
	{
		options = extend(
		{
			soft: false,
			other: false
		},
		options)

		expect(symbols).ok

		symbols = [].concat(symbols)

		symbols = symbols.map(Symbl)

		return xign.quotes(invoke(symbols, 'toXign'), for_date)
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
					var orig_symbol = symbols[i]

					var symbol = orig_symbol.toFull()
					symbol.company = r.company

					r = omit(r, 'symbol', 'company')

					r.symbol = symbol

					if (r.price != null)
					{
						return r
					}

					if (orig_symbol.isOther())
					{
						if (options.other)
						{
							return r
						}
						else
						{
							throw OtherSymbol()
						}
					}

					log('XIGN Quotes fallback', orig_symbol.toXign())

					return quotes_fallback_resolve(r, orig_symbol)
					.catch(err =>
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
				}
			})
		})
		.then(it => Promise.all(it)) /* ridiculous wrapper */
	}

	function quotes_fallback_resolve (r, symbol)
	{
		return symbols.resolve.cache(symbol)
		.then(symbol =>
		{
			r.symbol = symbol

			return r
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


	symbols.getInfo = (symbol) =>
	{
		return Promise.all(
		[
			// get_historical(symbol),
			get_last_fundamentals(symbol),
			xign.quotes([ symbol ]),
		])
		.then(so =>
		{
			return merge(so[0], so[1][0])
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
	var keyspace = db.helpers.Keyspace('portfolio')

	symbols.seriesForPortfolio = db.cache.regular('portfolio',
		{ ttl: 60 * 60 },
		(symbol, range) => [ symbol, apidate(range.start), apidate(range.end) ],
		(symbol, range) =>   xign.seriesRange(symbol, range.start, range.end)
	)

	// console.log(end_m / 5)
	// console.log(Math.floor(end_m / 5))
	// console.log(Math.floor(end_m / 5) * 5)

	symbols.seriesForPortfolio.intraday = db.cache.slip('portfolio.intraday',
		{ ttl: Infinity },
		(symbol) => symbol,
		(symbol, range) => xign.series.intraday(symbol, range.start, range.end)
	)

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

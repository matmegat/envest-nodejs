
var expect = require('chai').expect

var Xign = require('./Xign')
var Symbl = require('./Symbl')
var Cache = require('./ResolveCache')

var Err = require('../../../Err')
var UnknownSymbol = Err('unknown_symbol', `Symbol cannot be resolved`)
var GetDataErr = Err(
	'unable_to_retrive_data_from_server',
	'Unable to retrive data from server'
)

var omit = require('lodash/omit')
var invoke = require('lodash/invokeMap')
var merge = require('lodash/merge')
var get = require('lodash/get')

var moment = require('moment')

var Symbols = module.exports = function Symbols (cfg, log)
{
	var symbols = {}

	var cache = Cache()

	var xign = Xign(cfg.xignite, log)

	symbols.resolve = (symbol) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
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
			.then(symbol =>
			{
				cache.put(symbol, symbol)

				return symbol
			})
		})
	}

	symbols.resolveMany = (symbols_arr, soft_mode) =>
	{
		var queries = symbols_arr
		.map(symbols.resolve.cache)

		if (soft_mode)
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
	symbols.resolve.cache = (symbol) =>
	{
		return new Promise(rs =>
		{
			var data = cache.get(symbol)

			if (data)
			{
				return rs(data)
			}

			return rs(symbols.resolve(symbol))
		})
	}


	symbols.quotes = (symbols, for_date, soft_mode) =>
	{
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
					var symbol = symbols[i].toFull()
					symbol.company = r.company

					r = omit(r, 'symbol', 'company')

					r.symbol = symbol

					if (r.price != null)
					{
						return r
					}
					else
					{
						log('XIGN Quotes fallback', symbols[i].toXign())
						log('soft_mode', soft_mode)

						return quotes_fallback_resolve(r, symbols[i], soft_mode)
						.catch(err =>
						{
							if (soft_mode)
							{
								return r
							}
							else
							{
								throw err
							}
						})
					}
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


	function get_historical (symbol)
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.historical(symbol.toXign())
			.catch(() =>
			{
				// warn_rethrow ~
				// util.unwrap

				throw GetDataErr({ symbol: symbol })
			})
		})
		.then(resl =>
		{
			return {
				prev_close: resl.LastClose,
				low: resl.Low,
				high: resl.High,
				volume: resl.Volume,
				currency: resl.Currency,
				last: resl.Last,
				percent_change_from_open: resl.PercentChangeFromOpen
			}
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
			get_historical(symbol),
			get_last_fundamentals(symbol)
		])
		.then(so =>
		{
			return merge(so[0], so[1])
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

	symbols.seriesForPortfolio = (symbol, range) =>
	{
		return xign.seriesRange(symbol, range.start, range.end)
	}

	symbols.seriesForPortfolio.intraday = (symbol, range) =>
	{
		return xign.series.intraday(symbol, range.start, range.end)
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

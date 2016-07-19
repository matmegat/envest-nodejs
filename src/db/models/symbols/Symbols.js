
var expect = require('chai').expect

var Xign = require('./Xign')
var Symbl = require('./Symbl')
var Cache = require('./ResolveCache')

var Err = require('../../../Err')
var UnknownSymbol = Err('unknown_symbol', `Symbol cannot be resolved`)

var omit = require('lodash/omit')
var invoke = require('lodash/invokeMap')

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


	symbols.quotes = (symbols) =>
	{
		expect(symbols).ok

		symbols = [].concat(symbols)

		symbols = symbols.map(Symbl)

		return xign.quotes(invoke(symbols, 'toXign'))
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

						return quotes_fallback_resolve(r, symbols[i])
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


	symbols.series = (symbol, end_date, resolution, periods) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.series(symbol.toXign(), end_date, resolution, periods)
			.catch(() =>
			{
				throw UnknownSymbol({ symbol: symbol })
			})
		})
	}

	symbols.getInfoMock = (symbol) =>
	{
		var round = require('lodash/round')
		var random = require('lodash/random')

		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return {
				prev_close: round(random(50, 60, true), 1),
				open: round(random(50, 60, true), 1),
				low: round(random(50, 60, true), 1),
				high: round(random(50, 60, true), 1),
				one_year_low: round(random(50, 60, true), 1),
				one_year_high: round(random(50, 60, true), 1),
				market_cap: random(22000000, 55000000),
				volume: random(2000000, 3000000),
				p_e: null,
				dividend: null,
				currency: 'USD'
			}
		})
	}


	symbols.mock = (symbol) =>
	{
		return Symbl.validate(symbol)
		.then((symbol) =>
		{
			console.info(`Return MOCK data for ${symbol.toXign()}`)

			var now = () => moment.utc()

			return Promise.all(
			[
				mock_today(),
				mock_from_to(now().startOf('year'), now().endOf('day'), 24),
				mock_from_to(
					now().startOf('day').subtract(1, 'month'),
					now().endOf('day'),
					30
				),
				mock_from_to(
					now().startOf('day').subtract(6, 'month'),
					now().endOf('day'),
					26
				),
				mock_from_to(
					now().startOf('day').subtract(1, 'year'),
					now().endOf('day'),
					24
				),
				mock_from_to(
					now().startOf('day').subtract(5, 'year'),
					now().endOf('day'),
					20
				)
			])
		})
		.then((values) =>
		{
			return {
				today: values[0],
				ytd:   values[1],
				m1:    values[2],
				m6:    values[3],
				y1:    values[4],
				y5:    values[5]
			}
		})
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

var moment = require('moment')
var random = require('lodash/random')

function mock_today ()
{
	var today_series = []
	var timestamp = moment.utc().startOf('day').hours(8)
	var mock_value = random(50.0, 150.0, true)

	for (var i = 0; i <= 32; i ++)
	{
		today_series.push(
		{
			timestamp: timestamp.format(),
			value:     mock_value
		})

		timestamp.add(15, 'm')
		mock_value += random(-5.0, 5.0, true)
	}

	return Promise.resolve(today_series)
}

function mock_from_to (from, to, count)
{
	var mock_series = []
	var mock_value = random(50.0, 150.0, true)

	var intervals_count = count - 1 // intervals = 24 points
	var timestamp_step = to.diff(from) / intervals_count

	for (var i = 0; i < count; i ++)
	{
		mock_series.push(
		{
			timestamp: from.format(),
			value:     mock_value
		})

		from.add(timestamp_step, 'ms')
		mock_value += random(-5.0, 5.0, true)
	}

	return Promise.resolve(mock_series)
}

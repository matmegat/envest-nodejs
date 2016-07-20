
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


	symbols.mock = (symbol) =>
	{
		return Symbl.validate(symbol)
		.then((symbol) =>
		{
			console.info(`Return MOCK data for ${symbol.toXign()}`)

			var today = () => moment.utc().startOf('day')

			return Promise.all(
			[
				xign
				.bars(
					symbol.toXign(),
					today().subtract(5, 'days'),
					today().endOf('day')
				)
				.then(last_day),

				year_to_date(symbol)
				.then(take_n(24)),

				xign.series(
					symbol.toXign(),
					today(),
					'Day',
					today().diff(today().subtract(1, 'month'), 'days')
				),

				mock_from_to(
					today().subtract(6, 'month'),
					today().endOf('day'),
					26
				),
				mock_from_to(
					today().subtract(1, 'year'),
					today().endOf('day'),
					24
				),
				mock_from_to(
					today().subtract(5, 'year'),
					today().endOf('day'),
					20
				)
			])
		})
		.then((values) =>
		{
			return [
				{ period: 'today', points: values[0] },
				{ period: 'ytd', points: values[1] },
				{ period: 'm1', points: values[2] },
				{ period: 'm6', points: values[3] },
				{ period: 'y1', points: values[4] },
				{ period: 'y5', points: values[5] },
			]
		})
	}

	function last_day (chart_items)
	{
		if (! chart_items.length)
		{
			return  chart_items
		}

		var last_day = chart_items[chart_items.length - 1].timestamp
		last_day = moment(last_day).dayOfYear()

		return chart_items.filter((char_item) =>
		{
			return moment(char_item.timestamp).dayOfYear() === last_day
		})
	}

	function year_to_date (symbol)
	{
		var start_date = moment.utc().startOf('year')
		var end_date = moment.utc().endOf('day')

		var days = end_date.diff(start_date, 'days')

		if (days <= 20)
		{
			return xign.bars(symbol.toXign(), start_date, end_date)
		}
		else
		{
			return xign.series(symbol.toXign(), end_date, 'Day', days)
		}
	}

	function take_n (amount)
	{
		/* takes ${amount} of points from  chart items
		* - every point should be equidistant from one to another
		* */
		return (chart_items) =>
		{
			if (chart_items.length <= amount)
			{
				return Promise.resolve(chart_items)
			}

			var step = Math.floor(chart_items.length / amount)
			var equidistant_points = []

			for (var i = 0; i < chart_items.length; i += step)
			{
				equidistant_points.push(chart_items[i])
			}

			return Promise.resolve(equidistant_points)
		}
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

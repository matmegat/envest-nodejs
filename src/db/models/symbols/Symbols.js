
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
var forEach = require('lodash/forEach')
var merge = require('lodash/merge')

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

	function get_historical (symbol)
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.historical(symbol.toXign())
			.catch(err =>
			{
				console.log(err)

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
				currency: resl.Currency
			}
		})
	}

	function get_last_fundamentals (symbol)
	{
		var fundamentalsDefault = {
			market_cap: null,
			dividend: null,
			one_year_low: null,
			one_year_high: null
		}

		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.fundamentalsLast(symbol.toXign())
		})
		.then(resl =>
		{
			var fundamentals = resl.Fundamentals || []
			var obj = {}

			forEach(fundamentals, (el) =>
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
			fundamentalsDefault.market_cap = {
				value: Number(obj.MarketCapitalization.value) || null,
				unit: obj.MarketCapitalization.unit
			}
			fundamentalsDefault.dividend = Number(obj.DividendYieldDaily.value) || null 
			fundamentalsDefault.one_year_low = Number(obj.LowPriceLast52Weeks.value) || null 
			fundamentalsDefault.one_year_high = Number(obj.HighPriceLast52Weeks.value) || null 

			return fundamentalsDefault
		})
		.catch(() =>
		{
			return fundamentalsDefault
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

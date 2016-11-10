
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var extend = require('lodash/extend')

var Series = require('./Series')
var util = require('./util')

var moment = require('moment')


module.exports = function Xign (cfg, log, cache)
{
	expect(cfg).property('token')

	var token = cfg.token

	expect(token).a('string')

	var X = {}

	var logger = {}
	logger.warn_rethrow = (rs) =>
	{
		logger.warn(rs)
		throw rs
	}

	logger.warn = (rs) =>
	{
		log('XIGN Error:', rs.Message)
	}


	extend(X, Series(token, logger))

	X.quotes = (symbols, for_date) =>
	{
		expect(symbols).an('array')

		if (! symbols.length)
		{
			return Promise.resolve([])
		}

		symbols.forEach(s => expect(s).a('string'))

		if (! for_date)
		{
			return quotes_now.cache(symbols)
		}
		else
		{
			return quotes_for_date.cache(symbols, for_date)
		}
	}

	var quotes_now = (symbols) =>
	{
		var uri = format(
		{
			protocol: 'https:',
			host: 'globalquotes.xignite.com',

			pathname: '/v3/xGlobalQuotes.json/GetGlobalDelayedQuotes',

			query:
			{
				IdentifierType: 'Symbol',
				Identifiers: symbols.join(','),

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then(resl  => quotes_unwrap(resl, symbols))
	}

	var quotes_for_date = (symbols, for_date) =>
	{
		var uri = format(
		{
			protocol: 'https:',
			host: 'xignite.com',

			pathname: '/xGlobalHistorical.json/GetGlobalHistoricalQuotes',

			query:
			{
				IdentifierType: 'Symbol',
				Identifiers: symbols.join(','),

				AsOfDate: util.apidate(for_date),

				AdjustmentMethod: 'None',

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then(resl => quotes_unwrap(resl, symbols))
	}

	function quotes_unwrap (resl, symbols)
	{
		return resl
			.map(r =>
			{
				if (util.unwrap.isSuccess(r))
				{
					return r
				}
				else
				{
					return null
				}
			})
			.map((r, i) =>
			{
				var struct =
				{
					symbol: symbols[i],
					price:  null,
					gain:   null,

					prev_close: null,
					low: null,
					high: null,
					volume: null,
					last: null,
					percent_change_from_open: null,
					one_year_low: null,
					one_year_high: null,
					currency: null,
				}

				if (r)
				{
					extend(struct,
						{
							symbol:   symbols[i],
							currency: r.Currency,
							price:    r.Last,
							company:  r.Security.Name,

							prev_close: r.PreviousClose,
							low: r.Low,
							high: r.High,
							volume: r.Volume,
							last: r.Last,
							one_year_low: r.Low52Weeks,
							one_year_high: r.High52Weeks,
						})

					struct.gain = struct.percent_change_from_open
						// eslint-disable-next-line id-length
						= r.PercentChangeFromPreviousClose || 0
				}

				return struct
			})
	}

	/* Cached implementation */

	quotes_now.cache = (symbols) =>
	{
		var now = moment.utc() // will be used by quotes_key_fn only

		var cache_fn = cache.regular(`quotes_for_date`,
			{ ttl: 60 },
			quotes_key_fn,
			quotes_now
		)

		return cache_fn(symbols, now)
	}

	quotes_for_date.cache = (symbols, for_date) =>
	{
		var options = { ttl: 60 * 5 } // 5 minutes
		var today = moment.utc().startOf('day')
		if (moment.utc(for_date).isBefore(today))
		{
			options.ttl = 60 * 60 * 24 // 1 day
		}

		var cache_fn = cache.regular('quotes_for_date',
			options,
			quotes_key_fn,
			quotes_for_date
		)

		return cache_fn(symbols, for_date)
	}

	function quotes_key_fn (symbols, for_date)
	{
		var ts = moment.utc(for_date).format('YYYY-MM-DDTkk:mm')

		var today = moment.utc().startOf('day')
		if (moment.utc(for_date).isBefore(today))
		{
			ts = moment.utc(for_date).format('YYYY-MM-DD')
		}

		return `${ts}|${symbols.join(',')}`
	}

	X.resolve = (symbol) =>
	{
		expect(symbol).ok

		return fund(symbol)
		.then(data =>
		{
			return {
				symbol:   data.Company.Symbol, /* may be not full */
				exchange: data.Company.MarketIdentificationCode,
				company:  data.Company.Name
			}
		})
	}

	X.fundamentals = (symbol) =>
	{
		return fund(symbol, 'ext')
		.then(data =>
		{
			return data.FundamentalsSets
		})
		.then(util.unwrap.first)
	}

	var t1 = 'MarketCapitalization,BookValue,CEO'
	var t2 =
	[
		'MarketCapitalization',
		'HighPriceLast52Weeks',
		'LowPriceLast52Weeks',
		'DividendYieldDaily'
	].join(',')

	function fund (symbol, ext)
	{
		var types = t1
		if (ext)
		{
			types = t2
		}

		var uri = format(
		{
			protocol: 'https',
			host: 'factsetfundamentals.xignite.com',

			pathname: '/xFactSetFundamentals.json/GetLatestFundamentals',

			query:
			{
				IdentifierType: 'Symbol',
				Identifiers: symbol,

				FundamentalTypes: types,
				UpdatedSince: '',

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then(util.unwrap.first)
		.then(util.unwrap.success)
		.catch(logger.warn_rethrow)
	}

	X.lastTradeDate = (symbol) =>
	{
		expect(symbol).ok

		return last_closing_price(symbol)
		.then(data =>
		{
			if (! data.date)
			{
				return null
			}

			var date = moment.utc(data.date, 'M/D/YYYY')

			if (! date.isValid())
			{
				return null
			}

			return date
		})
	}

	var last_closing_price = (symbol) =>
	{
		var uri = format(
		{
			protocol: 'https:',
			host: 'xignite.com',

			pathname: '/xGlobalHistorical.json/GetGlobalLastClosingPrice',

			query:
			{
				IdentifierType: 'Symbol',
				Identifier: symbol,

				AdjustmentMethod: 'None',

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then(data =>
		{
			return {
				date: data.Date,
				last: data.LastClose,
				currency: data.Currency
			}
		})
	}

	return X
}

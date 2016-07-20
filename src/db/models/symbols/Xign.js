
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var extend = require('lodash/extend')

var Series = require('./Series')
var util = require('./util')


module.exports = function Xign (cfg, log)
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

	X.quotes = (symbols) =>
	{
		expect(symbols).an('array')

		if (! symbols.length)
		{
			return Promise.resolve([])
		}

		symbols.forEach(s => expect(s).a('string'))

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
		.then(resl =>
		{
			return resl
			.map(r =>
			{
				if (! util.unwrap.isSuccess(r))
				{
					logger.warn(r)
					return null
				}

				return r
			})
			.map((r, i) =>
			{
				var struct =
				{
					symbol: symbols[i],
					price:  null,
					gain:   null
				}

				if (r)
				{
					extend(struct,
					{
						symbol:   symbols[i],
						currency: r.Currency,
						price:    r.Last,
						company:  r.Security.Name,
						gain:     r.PercentChangeFromPreviousClose
					})
				}

				return struct
			})
		})
	}

	X.resolve = (symbol) =>
	{
		expect(symbol).ok

		return fundamentals(symbol)
		.then(data =>
		{
			return {
				symbol:   data.Company.Symbol, /* may be not full */
				exchange: data.Company.MarketIdentificationCode,
				company:  data.Company.Name
			}
		})
	}

	var fundamentals = X.fundamentals = (symbol) =>
	{
		var uri = format(
		{
			protocol: 'https:',
			host: 'factsetfundamentals.xignite.com',

			pathname: '/xFactSetFundamentals.json/GetFundamentals',

			query:
			{
				IdentifierType: 'Symbol',
				Identifiers: symbol,

				AsOfDate: util.apidate(),

				FundamentalTypes: 'MarketCapitalization,BookValue,CEO',
				ReportType: 'Annual',
				ExcludeRestated: 'false',
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

	var historical = X.historical = (symbol) =>
	{
		var uri = format(
		{
			protocol: 'https',
			host: 'xignite.com',

			pathname: '/xGlobalHistorical.json/GetGlobalHistoricalQuote',

			query:
			{
				IdentifierType: 'Symbol',
				Identifier: symbol,

				AdjustmentMethod: 'All',

				AsOfDate: util.apidate(),

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
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

	var fundamentalsLast = X.fundamentalsLast = (symbol) =>
	{
		var uri = format(
		{
			protocol: 'https',
			host: 'factsetfundamentals.xignite.com',

			pathname: '/xFactSetFundamentals.json/GetLatestFundamentals',

			query:
			{
				IdentifierType: 'Symbol',
				Identifiers: symbol,

				FundamentalTypes: 'MarketCapitalization,HighPriceLast52Weeks,LowPriceLast52Weeks,DividendYieldDaily',
				UpdatedSince: '',

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then(util.unwrap.first)
		.then(resl =>
		{
			return resl.FundamentalsSets
		})
		.then(util.unwrap.first)
	}

	return X
}

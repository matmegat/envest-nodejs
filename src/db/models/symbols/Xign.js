
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

	extend(X, Series(token))

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
					warn(r)
					return null
				}

				return r
			})
			.map((r, i) =>
			{
				var struct =
				{
					symbol: symbols[i],
					price:  null
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
		.catch(warn_rethrow)
	}


	function warn_rethrow (rs)
	{
		warn(rs)
		throw rs
	}

	function warn (rs)
	{
		log('XIGN Error:', rs.Message)
	}


	return X
}

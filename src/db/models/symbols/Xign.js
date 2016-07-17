
var expect = require('chai').expect

var format = require('url').format
// var parse  = require('url').parse

var request = require('axios')

var moment = require('moment')

var extend = require('lodash/extend')

module.exports = function Xign (cfg, log)
{
	expect(cfg).property('token')

	var token = cfg.token

	expect(token).a('string')

	var X = {}

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
		.then(unwrap.data)
		.then(resl =>
		{
			return resl
			.map(r =>
			{
				if (! unwrap.isSuccess(r))
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

				AsOfDate: apidate(),

				FundamentalTypes: 'MarketCapitalization,BookValue,CEO',
				ReportType: 'Annual',
				ExcludeRestated: 'false',
				UpdatedSince: '',

				_Token: token
			}
		})

		return request(uri)
		.then(unwrap.data)
		.then(unwrap.first)
		.then(unwrap.success)
		.catch(warn_rethrow)
	}


	function apidate (it)
	{
		return moment(it).format('M/DD/YYYY')
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

var unwrap = {}

unwrap.data  = (rs) => rs.data

unwrap.first = (rs) => rs[0]

unwrap.success = (rs) =>
{
	if (! unwrap.isSuccess(rs))
	{
		throw rs
	}

	return rs
}

unwrap.isSuccess = (rs) =>
{
	return rs.Outcome === 'Success'
}

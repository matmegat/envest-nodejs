
var expect = require('chai').expect

var format = require('url').format
// var parse  = require('url').parse

var request = require('axios')

var moment = require('moment')

module.exports = function Xign (cfg)
{
	expect(cfg).property('token')

	var token = cfg.token

	expect(token).a('string')

	var X = {}

	X.fundamentals = (symbol) =>
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

				AsOfDate: '6/27/2016',

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
	}

	function apidate (it)
	{
		return moment(it).format('M/DD/YYYY')
	}

	return X
}

var unwrap = {}

unwrap.data  = (rs) => rs.data

unwrap.first = (rs) => rs[0]

unwrap.success = (rs) =>
{
	if (rs.Outcome !== 'Success')
	{
		throw rs
	}

	return rs
}

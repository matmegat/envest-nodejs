
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

				_Token: '5198053EF65A4DE691F4D622001DEE79'
			}
		})

		return request(uri)
	}

	function apidate (it)
	{
		return moment(it).format('M/DD/YYYY')
	}

	return X
}

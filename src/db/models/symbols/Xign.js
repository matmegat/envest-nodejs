
var format = require('url').format
var parse  = require('url').parse

var expect = require('chai').expect

var request = require('axios')

module.exports = function Xign (cfg)
{
	expect(cfg).property('token')

	var token = cfg.token

	expect(token).a('string')

	var X = {}

	X.fundamentals = (symbol) =>
	{
		var uri = format({
protocol: 'https:',
  // slashes: true,
  // auth: null,
  host: 'factsetfundamentals.xignite.com',
  // port: null,
  // hostname: 'factsetfundamentals.xignite.com',
  // hash: null,
  // search: '?IdentifierType=Symbol&Identifiers=GOOG&FundamentalTypes=MarketCapitalization,BookValue,CEO&AsOfDate=6/27/2016&ReportType=Annual&ExcludeRestated=false&UpdatedSince=&_Token=5198053EF65A4DE691F4D622001DEE79',
  query: 
   { IdentifierType: 'Symbol',
     Identifiers: 'GOOG',
     FundamentalTypes: 'MarketCapitalization,BookValue,CEO',
     AsOfDate: '6/27/2016',
     ReportType: 'Annual',
     ExcludeRestated: 'false',
     UpdatedSince: '',
     _Token: '5198053EF65A4DE691F4D622001DEE79' },
  pathname: '/xFactSetFundamentals.json/GetFundamentals',
  // path: '/xFactSetFundamentals.json/GetFundamentals?IdentifierType=Symbol&Identifiers=GOOG&FundamentalTypes=MarketCapitalization,BookValue,CEO&AsOfDate=6/27/2016&ReportType=Annual&ExcludeRestated=false&UpdatedSince=&_Token=5198053EF65A4DE691F4D622001DEE79',
  // href: 'https://factsetfundamentals.xignite.com/xFactSetFundamentals.json/GetFundamentals?IdentifierType=Symbol&Identifiers=GOOG&FundamentalTypes=MarketCapitalization,BookValue,CEO&AsOfDate=6/27/2016&ReportType=Annual&ExcludeRestated=false&UpdatedSince=&_Token=5198053EF65A4DE691F4D622001DEE79'
	})

		console.log(uri)

		// var uri = parse('https://factsetfundamentals.xignite.com/xFactSetFundamentals.json/GetFundamentals?IdentifierType=Symbol&Identifiers=GOOG&FundamentalTypes=MarketCapitalization,BookValue,CEO&AsOfDate=6/27/2016&ReportType=Annual&ExcludeRestated=false&UpdatedSince='+'&_Token='+token, true)
		return request(uri)

		return Promise.resolve()
	}

	return X
}

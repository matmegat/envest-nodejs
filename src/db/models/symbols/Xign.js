
var format = require('util').format


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
		return request('https://factsetfundamentals.xignite.com/xFactSetFundamentals.json/GetFundamentals?IdentifierType=Symbol&Identifiers=GOOG&FundamentalTypes=MarketCapitalization,BookValue,CEO&AsOfDate=6/27/2016&ReportType=Annual&ExcludeRestated=false&UpdatedSince='+'&_Token='+token)
	}

	return X
}

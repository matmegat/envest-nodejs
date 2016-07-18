
var expect = require('chai').expect

var format = require('url').format

var request = require('axios')

module.exports = function Series (token)
{
	var series = {}

	expect(token).a('string')

	series.series = (symbol, end_date, resolution, periods) =>
	{
		resolution = 'Day'

		console.log(symbol, end_date, resolution, periods)

		var uri = format(
		{
			protocol: 'https:',
			host: 'www.xignite.com',

			pathname: '/xGlobalHistorical.json/GetGlobalHistoricalQuotesAsOf',

			query:
			{
				IdentifierType: 'Symbol',
				Identifier: symbol,

				AdjustmentMethod: 'SplitOnly',

				EndDate: end_date,
				PeriodType: resolution,
				Periods: periods,

				_Token: token
			}
		})

		console.log(uri)
		console.log(String(uri))

		return request(uri)
		.then(it =>
		{
			it = it.data

			console.log('JSON')
			console.log(it)

			return it
		})
	}

	return series
}

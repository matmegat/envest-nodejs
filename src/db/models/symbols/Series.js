
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var util = require('./util')

module.exports = function Series (token)
{
	var series = {}

	expect(token).a('string')

	series.series = (symbol, end_date, resolution, periods) =>
	{
		end_date = util.apidate(end_date)
		resolution = 'Day'

		console.warn(symbol, end_date, resolution, periods)

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


		return request(uri)
		.then(util.unwrap.data)
		.then(it =>
		{
			console.log('JSON')
			console.log(it)

			return it
		})
	}

	return series
}

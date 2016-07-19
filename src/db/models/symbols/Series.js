
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var util = require('./util')

module.exports = function Series (token, logger)
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
		.then(util.unwrap.success)
		.then(it =>
		{
			console.log('JSON')
			console.log(it)

			// GlobalQuotes

			return it
		})
		.catch(logger.warn_rethrow)
	}

	// series.intraday = () => {}
	// or
	// series.series.intraday = () => {}

	series.bars = (symbol, start_date, end_date) =>
	{
		var precision = 'Minutes'
		var period = 15

		var uri = format(
		{
			protocol: 'https:',
			host: 'globalquotes.xignite.com',

			pathname: '/v3/xGlobalQuotes.json/GetBars',

			query:
			{
				IdentifierType: 'Symbol',
				Identifier: symbol,

				StartTime: start_date.format('M/DD/YYYY HH:mm a'),
				EndTime: end_date.format('M/DD/YYYY HH:mm a'),

				Precision: precision,
				Period: period,

				_Token: token
			}
		})

		return request(uri)
		.then(util.unwrap.data)
		.then((data) =>
		{
			if (data.Outcome === 'RequestError')
			{	// && data.Message === 'No ticks available for Symbol...'
				return []
			}

			if (! data.Bars)
			{
				return []
			}

			var last_date = data.Bars[data.Bars.length - 1].StartDate

			return data.Bars
			.map((bar) =>
			{
				return {
					timestamp: `${bar.StartDate} ${bar.StartTime}`,
					utcOffset: bar.UTCOffset,
					value:     bar.Close
				}
			})
		})
	}

	return series
}

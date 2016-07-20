
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var util = require('./util')

var orderBy = require('lodash/orderBy')

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
		.then(it =>
		{
			var quotes = orderBy(it.GlobalQuotes, (quote) =>
			{
				return new Date(quote.Date)
			})

			return quotes.map((quote) =>
			{
				return {
					timestamp: quote.Date,
					value:     quote.LastClose
				}
			})
		})
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

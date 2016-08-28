
var expect = require('chai').expect

var format = require('url').format
var request = require('axios')

var util = require('./util')

var orderBy = require('lodash/orderBy')

var moment = require('moment')

module.exports = function Series (token)
{
	var series = {}

	expect(token).a('string')

	series.series = (symbol, end_date, periods) =>
	{
		end_date = util.apidate(end_date)

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
				PeriodType: 'Day',
				Periods: periods,

				_Token: token
			}
		})

		return request(uri)
		.then(transform_series)
	}

	series.seriesRange = (symbol, start_date, end_date) =>
	{
		start_date = util.apidate(start_date)
		end_date   = util.apidate(end_date)

		var uri = format(
		{
			protocol: 'https:',
			host: 'www.xignite.com',

			pathname: '/xGlobalHistorical.json/GetGlobalHistoricalQuotesRange',

			query:
			{
				IdentifierType: 'Symbol',
				Identifier: symbol,

				AdjustmentMethod: 'SplitOnly',

				StartDate: start_date,
				EndDate: end_date,

				_Token: token
			}
		})

		return request(uri)
		.then(transform_series)
	}

	function transform_series (data)
	{
		data = util.unwrap.data(data)

		var quotes = orderBy(data.GlobalQuotes, (quote) =>
		{
			return new Date(quote.Date)
		})

		return quotes.map((quote) =>
		{
			return {
				timestamp: moment.utc(quote.Date, 'M/DD/YYYY').format(),
				value:     quote.LastClose
			}
		})
	}


	series.series.intraday = (symbol, start_date, end_date) =>
	{
		var precision = 'Minutes'
		var period = 5

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
				var offset = moment.duration(bar.UTCOffset, 'hours')

				if (offset < 0)
				{
					offset = ('00' + Math.abs(offset.hours())).slice(-2) +
						('00' + Math.abs(offset.minutes())).slice(-2)
					offset = `-${offset}`
				}
				else
				{
					offset = ('00' + offset.hours()).slice(-2) +
						('00' + offset.minutes()).slice(-2)
				}

				var timestamp = `${bar.StartDate} ${bar.StartTime} ${offset}`
				var format = 'M/DD/YYYY hh:mm:ss a ZZ'

				return {
					timestamp: moment(timestamp, format).utc().format(),
					utcOffset: bar.UTCOffset,
					value:     bar.Close
				}
			})
		})
	}

	return series
}

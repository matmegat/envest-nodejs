
var map       = require('lodash/map')
var mapValues = require('lodash/mapValues')
var maxBy     = require('lodash/maxBy')

var moment = require('moment')
var Parse  = require('csv-parse')

var Err    = require('../../../../Err')
var knexed = require('../../../knexed')
var Symbl  = require('../../symbols/Symbl')

module.exports = function Parser (portfolio, db)
{
	var parser = {}

	var knex = db.knex

	var UploadHistoryError = Err('upload_history_error',
		'Unable to upload history of Investor')

	parser.parseCsv = (investor_id, csv) =>
	{
		return db.investor.all.ensure(investor_id)
		.then(() =>
		{
			return Promise.all(
			[
				portfolio.availableDate(investor_id),
				csv_to_array(csv)
			])
		})
		.then(values =>
		{
			mapValues(values[0], (val) => val.forEach((entry) =>
			{
				if (entry)
				{
					entry.available_from = moment.utc(entry.available_from)
				}
			}))


			var bulk_data = values[1]
			var available_from = maxBy(
				[
					maxBy(values[0].brokerage, 'available_from'),
					maxBy(values[0].symbols, 'available_from')
				],
				'available_from'
			)
			.available_from


			if (! available_from)
			{	// any date is available
				available_from = moment.utc(0) // Jan 01 1970
			}

			bulk_data.forEach(entry =>
			{
				entry.is_valid_date = moment.utc(entry.Date) >= available_from

				if (entry.Stock)
				{
					entry.symbol = Symbl([entry.Stock])
				}
			})

			return db.symbols.resolveMany(map(bulk_data, 'symbol'), true)
			.then(symbols =>
			{
				symbols.forEach((symbol, i) =>
				{
					bulk_data[i].symbol = symbol
					bulk_data[i].is_resolved = symbol !== null
				})

				return bulk_data
			})
		})
	}

	function csv_to_array (csv)
	{
		var parser_options =
		{
			delimiter: ',',
			columns: ['Date', 'Type', 'Cash', 'Stock', 'Amount', 'Price'],
			skip_empty_lines: true
		}

		return new Promise((rs, rj)  =>
		{
			Parse(csv.buffer.toString(), parser_options, (err, output) =>
			{
				if (err)
				{
					return rj(UploadHistoryError({ reason: err.message }))
				}

				return rs(output)
			})
		})
		.then(values =>
		{
			mapValues(values[0], (val, key) =>
			{
				if (val !== key)
				{
					throw UploadHistoryError(
					{
						reason: 'Invalid column names'
					})
				}
			})

			return values.slice(1)
		})
	}

	parser.uploadHistory
		= knexed.transact(knex, (trx, investor_id, whom_id, csv) =>
	{
		return portfolio.parseCsv(investor_id, csv)
	})

	return parser
}

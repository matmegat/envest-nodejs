
var concat    = require('lodash/concat')
var every     = require('lodash/every')
var map       = require('lodash/map')
var mapValues = require('lodash/mapValues')

var moment = require('moment')
var Parse  = require('csv-parse')

var Err      = require('../../../../Err')
var knexed   = require('../../../knexed')
var Symbl    = require('../../symbols/Symbl')
var validate = require('../../../validate')

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
			var available_from = moment.utc(values[0].common.available_from)
				// moment.utc(values[0].common always exist, but could be null
				// moment.utc(null) -> invalid moment
			var bulk_data = values[1]


			if (values[0].common.available_from === null)
			{	// any date is available
				available_from = moment.utc(0) // Jan 01 1970
			}

			if (! available_from.isValid())
			{
				throw UploadHistoryError(
				{
					reason: 'Unable to get portfolio available dates'
				})
			}

			bulk_data.forEach((entry, i) =>
			{
				entry.is_valid_date = moment.utc(entry.Date) >= available_from

				if (entry.Stock)
				{
					entry.symbol = Symbl([entry.Stock])
				}

				if (entry.Cash)
				{
					entry.Cash = Number(entry.Cash)
					validate.number(entry.Cash, `csv[${i + 1}].Cash`)
				}

				if (entry.Amount)
				{
					entry.Amount = Number(entry.Amount)
					validate.number(entry.Amount, `csv[${i + 1}].Amount`)
				}

				if (entry.Price)
				{
					entry.Price = Number(entry.Price)
					validate.number(entry.Price, `csv[${i + 1}].Price`)
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

	var methods =
	{
		brokerage: portfolio.brokerage.set, // trx, investor_id, cash, timestamp
		holdings:  portfolio.holdings.set, // trx, investor_id, holding_entries
		trade:     portfolio.makeTrade, // trx, investor_id, type, date, data
		cash:      portfolio.manageCash, // trx, investor_id, op
	}

	parser.uploadHistoryAs
		= knexed.transact(knex, (trx, investor_id, whom_id, csv) =>
	{
		// TODO: check access rights

		return portfolio.parseCsv(investor_id, csv)
		.then(bulk_data =>
		{
			if (! every(bulk_data, { is_valid_date: true }))
			{
				throw UploadHistoryError(
				{
					reason: 'Not all entries could be added'
				})
			}

			var sequential = sequential_operation(trx, investor_id)

			return sequential(bulk_data[0], 0, bulk_data)
		})
		.catch(err =>
		{
			if (Err.is(err))
			{
				throw err
			}
			else
			{
				throw UploadHistoryError({ reason: err.message })
			}
		})
		.then((end) =>
		{
			return { processed: end }
		})
	})

	function sequential_operation (trx, investor_id)
	{
		return function sequential_caller (entry, index, origin)
		{
			var data = entry_2_data(entry)

			return data.method.apply(this, concat(trx, investor_id, data.args))
			.then(() =>
			{
				if ( ++ index < origin.length)
				{
					return sequential_caller(origin[index], index, origin)
				}
				else
				{
					return index - 1 // amount of processed operations
				}
			})
		}
	}

	/* eslint-disable complexity */
	function entry_2_data (entry)
	{
		var cash_management_ops =
		[
			'deposit',
			'withdraw',
			'interest',
			'fee'
		]

		var is_stock = entry.Stock && entry.Amount && entry.Price

		if (entry.Type === 'onboarding' && entry.Cash)
		{
			return {
				method: methods.brokerage,
				args: [entry.Cash, moment.utc(entry.Date).format()]
			}
		}

		if (entry.Type === 'onboarding' && is_stock)
		{
			return {
				method: methods.holdings,
				args:
				[
					[{
						symbol: entry.Stock,
						amount: entry.Amount,
						price:  entry.Price,
						date:   moment.utc(entry.Date).format()
					}]
				]
			}
		}

		if (cash_management_ops.indexOf(entry.Type) !== -1 && entry.Cash)
		{
			if (entry.Type === 'withdraw' || entry.Type === 'fee')
			{
				entry.Cash *= -1
			}

			return {
				method: methods.cash,
				args:
				[
					{
						type: entry.Type,
						cash: entry.Cash,
						date: moment.utc(entry.Date).format()
					}
				]
			}
		}

		if ((entry.Type === 'bought' || entry.Type === 'sold') && is_stock)
		{
			if (! entry.is_resolved)
			{
				throw UploadHistoryError(
				{
					reason: `Invalid entry '${entry.Date} - ${entry.Type}'`
				})
			}

			return {
				method: methods.trade,
				args:
				[
					'trade',
					moment.utc(entry.Date).format(),
					{
						dir: entry.Type,
						symbol: entry.symbol,
						amount: entry.Amount,
						price: entry.Price
					}
				]
			}
		}

		throw UploadHistoryError(
		{
			reason: `Invalid entry '${entry.Date} - ${entry.Type}'`
		})
	}
	/* eslint-enable complexity */


	return parser
}

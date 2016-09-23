
var concat    = require('lodash/concat')
var every     = require('lodash/every')
var flatten   = require('lodash/flatten')
var isNumber  = require('lodash/isNumber')
var groupBy   = require('lodash/groupBy')
var map       = require('lodash/map')
var mapValues = require('lodash/mapValues')
var orderBy   = require('lodash/orderBy')
var values    = require('lodash/values')

var expect = require('chai').expect
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

	expect(db, 'Parser depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var csvUploadedA = Emitter('csv_uploaded', { group: 'admins' })
	var csvUploadedI = Emitter('csv_uploaded')

	var UploadHistoryError = Err('upload_history_error',
		'Unable to upload history of Investor')

	var AdminOrOwnerRequired =
		Err('admin_or_owner_required', 'Admin Or Investor-Owner Required')

	function ensure_can_upload (whom_id, target_investor_id)
	{
		return Promise.all(
		[
			db.admin.is(whom_id),
			db.investor.all.is(whom_id)
		])
		.then(so =>
		{
			var is_admin    = so[0]
			var is_investor = so[1]

			if (is_admin)
			{
				return 'mode:admin'
			}
			else if (is_investor)
			{
				if (! (whom_id === target_investor_id))
				{
					throw AdminOrOwnerRequired()
				}

				return 'mode:investor'
			}
			else
			{
				throw AdminOrOwnerRequired()
			}
		})
	}

	parser.parseCsv = (investor_id, whom_id, csv) =>
	{
		return ensure_can_upload(whom_id, investor_id)
		.then(() => db.investor.all.ensure(investor_id))
		.then(() => csv_to_array(csv))
		.then(bulk_data => transform_hist_data(bulk_data, investor_id))
	}

	function transform_hist_data (bulk_data, investor_id)
	{
		return portfolio.availableDate(investor_id)
		.then((portfolio_date) =>
		{
			var available_from = moment.utc(portfolio_date.available_from)

			if (portfolio_date.available_from === null)
			{	// any date is available
				available_from = moment.utc(0) // Jan 01 1970
			}

			if (! available_from.isValid())
			{
				throw UploadHistoryError(
					{
						reason: 'Unable to get portfolio available date'
					})
			}

			bulk_data.forEach((entry, i) =>
			{
				entry.date = moment.utc(entry.Date)
				entry.is_valid_date
				 = entry.date.isValid() && entry.date >= available_from

				if (entry.Stock)
				{
					entry.symbol = Symbl(entry.Stock)
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

			var options = { soft: true, other: true }
			return db.symbols.resolveMany(map(bulk_data, 'symbol'), options)
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
		return ensure_can_upload(whom_id, investor_id)
		.then(mode =>
		{
			var sequential = sequential_operation(trx, investor_id)

			return db.investor.all.ensure(investor_id)
			.then(() => csv_to_array(csv))
			.then(bulk_data => transform_hist_data(bulk_data, investor_id))
			.then(bulk_data =>
			{
				if (! every(bulk_data, { is_valid_date: true }))
				{
					throw UploadHistoryError(
					{
						reason: 'Not all entries could be added'
						// TODO: show entries that could not be added
					})
				}

				return adjust_date(bulk_data)
			})
			.then(bulk_data =>
			{
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
			.then(added_amount =>
			{
				if (mode === 'mode:admin')
				{
					csvUploadedI(investor_id, {
						by: 'admin',
						admin: [ ':user-id', whom_id ]
					})
				}
				else
				{
					csvUploadedA({
						by: 'investor',
						investor: [ ':user-id', investor_id ]
					})
				}

				return { processed: added_amount }
			})
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
					return index // amount of processed operations
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

		var is_stock = entry.Stock && entry.Amount && isNumber(entry.Price)

		if (entry.Type === 'onboarding' && entry.Cash)
		{
			return {
				method: methods.brokerage,
				args: [entry.Cash, entry.date.format()]
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
						date:   entry.date.format()
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
						date: entry.date.format()
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
					entry.date.format(),
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

	function adjust_date (bulk_data)
	{
		var minutes_offset = 5
		var by_date = groupBy(bulk_data, 'date')

		var adjusted_dates = mapValues(by_date, (values) =>
		{
			if (values.length > 1)
			{

				values.forEach((entry, i) =>
				{
					entry.date.add(i * minutes_offset, 'minutes')
				})
			}

			return values
		})

		adjusted_dates = values(adjusted_dates)
		adjusted_dates = flatten(adjusted_dates)

		return orderBy(adjusted_dates, 'date')
	}

	return parser
}

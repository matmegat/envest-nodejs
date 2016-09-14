
var noop = require('lodash/noop')
var map  = require('lodash/map')
var pick = require('lodash/pick')
var extend = require('lodash/extend')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var validate = require('../../../validate')
var Err = require('../../../../Err')

var Symbl = require('../../symbols/Symbl')

var moment = require('moment')

module.exports = function Holdings (db, investor, portfolio)
{
	var holdings = {}

	var knex = db.knex
	var table = knexed(knex, 'portfolio')

	var raw = knex.raw

	var oneMaybe = db.helpers.oneMaybe


	// byId
	holdings.byId = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return byId(trx, investor_id, for_date)
	})

	holdings.symbolById = knexed.transact(knex,
	(trx, symbol, investor_id, for_date) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return byId(trx, investor_id, for_date, function ()
			{
				this.where(symbol.toDb())
			})
		})
		.then(oneMaybe)
	})

	holdings.byId.quotes =
		knexed.transact(knex, (trx, investor_id, for_date, options) =>
	{
		options = options || {}

		return byId(trx, investor_id, for_date)
		.then(holdings =>
		{
			var symbols = holdings.map(holding =>
			{
				return [ holding.symbol_ticker, holding.symbol_exchange ]
			})

			return db.symbols.quotes(symbols, for_date, options.soft)
			.then(quotes =>
			{
				return quotes.map((quote, i) =>
				{
					if (! quote.price && ! options.soft)
					{
						throw new TypeError(
							'Cannot recalculate Xignite Quotes failed'
						)
					}

					var holding = holdings[i]

					holding.symbol = quote.symbol

					holding.quote_price = quote.price
					holding.gain = quote.gain
					holding.currency = quote.currency

					holding.real_allocation
					 = holding.amount * (holding.quote_price || holding.price)

					delete holding.symbol_ticker
					delete holding.symbol_exchange

					return holding
				})
			})
		})
	})


	var NoSuchHolding = Err('no_such_holding',
		'Investor does not posess such holding')

	holdings.ensure = knexed.transact(knex, (trx, symbol, investor_id) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return holdings.symbolById(trx, symbol, investor_id)
		})
		.then(so =>
		{
			if (! so)
			{
				throw NoSuchHolding({ symbol: symbol })
			}

			return so
		})
	})

	holdings.isDateAvail =
		knexed.transact(knex, (trx, investor_id, for_date, symbol) =>
	{
		if (symbol)
		{
			symbol = Symbl(symbol)
		}

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			var where = { investor_id: investor_id }
			if (symbol)
			{
				extend(where, symbol.toDb())
			}

			return table(trx)
			.where(where)
			.andWhere('timestamp', '>', for_date)
		})
		.then(res =>
		{
			return ! res.length
		})
	})


	holdings.isExact =
		knexed.transact(knex, (trx, investor_id, symbol, timestamp) =>
	{
		return table(trx)
		.where('investor_id', investor_id)
		.where('timestamp', timestamp)
		.where(symbol.toDb())
		.then(oneMaybe)
		.then(Boolean)
	})


	function byId (trx, investor_id, for_date, aux)
	{
		aux || (aux = noop)

		return knex(raw('portfolio AS P'))
		.transacting(trx)
		.select('symbol_ticker', 'symbol_exchange', 'amount', 'price')
		.where('investor_id', investor_id)
		.where('amount', '>', 0)
		.where('timestamp',
			table().max('timestamp')
			.where(
			{
				investor_id:     raw('P.investor_id'),
				symbol_exchange: raw('P.symbol_exchange'),
				symbol_ticker:   raw('P.symbol_ticker'),
			})
			.where(function ()
			{
				if (for_date)
				{
					this.where('timestamp', '<=', for_date)
				}
			})
		)
		.where(aux)
		.then(r =>
		{
			r.forEach(it =>
			{
				it.price = Number(it.price)
			})

			return r
		})
	}


	// grid
	var groupBy = require('lodash/groupBy')
	var orderBy = require('lodash/orderBy')
	var toPairs = require('lodash/toPairs')

	var values = require('lodash/values')

	var first = require('lodash/head')
	var last  = require('lodash/last')

	holdings.grid = knexed.transact(knex, (trx, investor_id, resolution) =>
	{
		resolution || (resolution = 'day')

		return table(trx)
		.select(
			'timestamp',
			raw(`date_trunc('day', timestamp) + INTERVAL '1 day' as day`),
			'symbol_exchange',
			'symbol_ticker',
			'amount',
			'price'
		)
		.where('investor_id', investor_id)
		.orderBy('timestamp')
		.then(datadays =>
		{
			var grid = {}

			var involved = new Set
			var running  = {}

			if (resolution === 'day')
			{
				datadays = groupBy(datadays, it => it.day.toISOString())
			}
			else
			{
				datadays = groupBy(datadays, it => it.timestamp.toISOString())
			}
			datadays = toPairs(datadays)
			datadays = orderBy(datadays, '0')

			datadays = datadays.map(pair =>
			{
				var day = pair[1]

				day.forEach(entry =>
				{
					var symbol
					 = Symbl([ entry.symbol_ticker, entry.symbol_exchange ])

					entry =
					{
						symbol: symbol,
						price:  Number(entry.price),
						amount: entry.amount
					}


					var xsymbol = symbol.toXign()

					if (entry.amount)
					{
						involved.add(xsymbol)

						running[xsymbol] = entry
					}
					else
					{
						delete running[xsymbol]
					}
				})

				day = values(running)

				return [ pair[0], day ]
			})

			grid.involved = Array.from(involved)

			/* Can be empty if no Trades in
			   corresponding period of time.
			 */
			if (datadays.length)
			{
				grid.daterange =
				[
					first(datadays)[0],
					 last(datadays)[0]
				]
			}
			else
			{
				grid.daterange = null
			}

			grid.datadays = datadays

			running = null

			return grid
		})
	})


	// set
	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')
	var InvalidHoldingDate = Err('invalid_portfolio_date',
		'Invalid date value for Portfolio Holdings')

	holdings.set = knexed.transact(knex, (trx, investor_id, holding_entries) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			validate.array(holding_entries, 'holdings')

			holding_entries.forEach((holding, i) =>
			{
				validate.required(holding.symbol, `holdings[${i}].symbol`)
				validate.empty(holding.symbol, `holdings[${i}].symbol`)

				validate.number(holding.amount, `holdings[${i}].amount`)
				if (holding.amount < 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].amount` })
				}

				validate.number(holding.price, `holdings[${i}].price`)
				if (holding.price <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].price` })
				}

				validate.required(holding.date, `holdings[${i}].date`)
				validate.date(holding.date, `holdings[${i}].date`)
				holding.date = moment.utc(holding.date)
				if (holding.date > moment.utc())
				{
					throw InvalidHoldingDate({ field: `holdings[${i}].date` })
				}
				holding.timestamp = holding.date.format()
			})

			return db.symbols.resolveMany(map(holding_entries, 'symbol'))
		})
		.then(symbols => symbols.map(Symbl))
		.then(symbols =>
		{
			return Promise.all(symbols.map((symbol, i) =>
			{
				var holding = holding_entries[i]
				var data = pick(holding, 'amount', 'price', 'timestamp')

				return put(trx, investor_id, symbol, data, { override: true })
			}))
		})
		.then(() =>
		{
			// choose latest timestamp
			var index = 0
			var timestamp = holding_entries[index].date
			holding_entries.forEach((holding, i) =>
			{
				if (holding.date > timestamp)
				{
					timestamp = holding.date
					index = i
				}
			})

			return portfolio.brokerage
			.recalculate(trx, investor_id, holding_entries[index].timestamp)
		})
	})


	function put (trx, investor_id, symbol, data, options)
	{
		expect(symbol).ok
		expect(symbol.exchange).a('string')
		expect(symbol.ticker).a('string')

		expect(data).ok
		expect(data.amount).a('number')
		expect(data.price).a('number')

		options || (options = {})

		data = pick(data,
		[
			'amount',
			'price',
			'timestamp'
		])

		if (data.timestamp)
		{
			data.timestamp = moment.utc(data.timestamp).format()
		}
		else
		{
			data.timestamp = moment.utc().format()
		}

		return holdings.isDateAvail(trx, investor_id, data.timestamp, symbol)
		.then(is_avail =>
		{
			if (! is_avail)
			{
				throw  InvalidHoldingDate(
				{
					symbol: symbol.toXign(),
					reason: 'More actual holding already exist'
				})
			}

			return holdings.isExact(trx, investor_id, symbol, data.timestamp)
		})
		.then(is_exact =>
		{
			if (is_exact && options.override)
			{
				return table(trx)
				.where('investor_id', investor_id)
				.where(symbol.toDb())
				.where('timestamp', data.timestamp)
				.update(pick(data, 'amount', 'price'))
			}
			else
			{
				var batch = extend(
					{ investor_id: investor_id },
					symbol.toDb(),
					data
				)

				return table(trx).insert(batch)
			}
		})
		.catch(Err.fromDb('timed_portfolio_point_unique', DuplicateHoldingEntry))
	}

	var DuplicateHoldingEntry = Err('holding_duplicate',
		'There can be only one Holding entry per timestamp for Investor')


	// buy, sell
	var validate_positive = validate.number.positive

	var NotEnoughMoney = Err('not_enough_money_to_buy',
		'Not Enough Money To Buy')

	holdings.buy = function (trx, investor_id, symbol, date, data)
	{
		validate_positive(data.amount, 'amount')
		validate_positive(data.price, 'price')

		var amount = data.amount
		var price  = data.price
		var sum    = amount * price

		var for_date = date

		return portfolio.brokerage.cashById(trx, investor_id, for_date)
		.then(cash =>
		{
			if (sum > cash)
			{
				throw NotEnoughMoney()
			}
		})
		.then(() =>
		{
			return holdings.symbolById(trx, symbol, investor_id, for_date)
		})
		.then(holding =>
		{
			if (holding)
			{
				price = ( holding.amount * holding.price + amount * price )
				        / ( holding.amount + amount )
				amount = holding.amount + amount
			}

			var data_put =
			{
				amount:    amount,
				price:     price,
				timestamp: date
			}

			return put(trx, investor_id, symbol, data_put)
		})
		.then(() =>
		{
			return -sum
		})
	}


	var NotEnoughAmount = Err('not_enough_amount_to_sell',
		'Not Enough Amount To Sell')

	holdings.sell = function (trx, investor_id, symbol, date, data)
	{
		validate_positive(data.amount, 'amount')
		validate_positive(data.price, 'price')

		var amount = data.amount
		var price  = data.price
		var sum    = amount * price

		return holdings.ensure(trx, symbol, investor_id)
		.then(holding =>
		{
			if (holding.amount < amount)
			{
				throw NotEnoughAmount(
				{
					available_amount: holding.amount,
					sell_amount: amount
				})
			}

			amount = holding.amount - amount

			var data_put =
			{
				amount:    amount,
				price:     holding.price,
				timestamp: date
			}

			return put(trx, investor_id, symbol, data_put)
		})
		.then(() =>
		{
			return sum
		})
	}

	return holdings
}

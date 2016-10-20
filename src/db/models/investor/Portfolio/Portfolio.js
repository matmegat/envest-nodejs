
var pick = require('lodash/pick')
var extend = require('lodash/extend')

var noop = require('lodash/noop')

var reduce = require('lodash/reduce')

var max = require('lodash/max')
var maxBy = require('lodash/maxBy')
var sumBy = require('lodash/sumBy')
var orderBy = require('lodash/orderBy')

var round = require('lodash/round')


var moment = require('moment')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')
var Grid = require('./Grid/Grid')

var Symbl = require('../../symbols/Symbl')

var validate = require('../../../validate')

var Err = require('../../../../Err')

var Parser = require('./Parser')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var brokerage = portfolio.brokerage = Brokerage(db, investor, portfolio)
	var holdings  = portfolio.holdings  =  Holdings(db, investor, portfolio)

	expect(db, 'Portfolio depends on Series').property('symbols')
	var symbols = portfolio.symbols = db.symbols

	var grid = Grid(investor, portfolio)

	var knex = db.knex

	portfolio.byId = knexed.transact(knex, (trx, investor_id, options) =>
	{
		return new Promise(rs =>
		{
			if (options.extended)
			{
				return rs(investor.all)
			}
			else
			{
				return rs(investor.public)
			}
		})
		.then((model) => model.ensure(investor_id, trx))
		.then(() =>
		{
			return Promise.all([
				brokerage.byId(trx, investor_id, null, { soft: true }),
				 holdings.byId
					.quotes(trx, investor_id, null, { soft: true, other: true })
			])
		})
		// eslint-disable-next-line max-statements
		.then((values) =>
		{
			var brokerage = values[0]
			var holdings  = values[1]

			var visible_fields = [ 'symbol', 'allocation', 'gain' ]
			if (options.extended)
			{
				visible_fields = visible_fields.concat([ 'price', 'amount' ])
			}

			/* collapse OTHER symbols */
			if (! options.extended)
			{
				var category_other = []

				holdings = holdings.reduce((seq, holding) =>
				{
					if (Symbl(holding.symbol).isOther())
					{
						category_other.push(holding)

						return seq
					}
					else
					{
						return seq.concat(holding)
					}
				}, [])

				var other =
				{
					symbol:
						Symbl('OTHER.OTHER').toFull(),
					allocation:
						sumBy(category_other, 'real_allocation')
						 * brokerage.multiplier,
					gain: null,
					price: 0,
					amount: sumBy(category_other, 'amount')
				}
			}

			/* full portfolio by quote price / full portfolio by buy price */
			var gain =
			(brokerage.cash + sumBy(holdings, 'real_allocation'))
			 /
			(brokerage.cash + reduce(holdings, (sum, h) =>
			{
				return sum + h.amount * h.price
			}, 0))

			gain = (gain - 1) * 100

			holdings = holdings.map((holding) =>
			{
				holding.allocation
				 = holding.real_allocation * brokerage.multiplier

				if (! holding.quote_price)
				{
					holding.gain = null
				}
				else
				{
					holding.gain
					 = (holding.quote_price / holding.price - 1 ) * 100
				}

				return pick(holding, visible_fields)
			})

			var total_holdings = orderBy(holdings, 'allocation', 'desc')

			if (! options.extended && other.amount)
			{
				/* if collapsed and > 0 */
				other.price = other.allocation / other.amount
				other = pick(other, visible_fields)

				total_holdings = total_holdings.concat(other)
			}

			var full_value
			 = brokerage.cash * brokerage.multiplier
			 + sumBy(holdings, 'allocation')

			var resp = {
				total:    total_holdings.length,
				holdings: total_holdings,
				full_portfolio:
				{
					value: full_value,
					gain:  gain
				}
			}

			if (options.extended)
			{
				resp.brokerage = brokerage
			}

			return resp
		})
	})

	portfolio.gain = knexed.transact(knex, (trx, investor_id) =>
	{
		var now = moment()
		var day_ytd = moment(now).startOf('year')
		var day_intraday = moment(now).startOf('day')

		return Promise.all(
		[
			fullValue(trx, investor_id, now),
			fullValue(trx, investor_id, day_ytd),
			fullValue(trx, investor_id, day_intraday)
		])
		.then(values =>
		{
			var now = values[0]
			var ytd = values[1]
			var day = values[2]

			return {
				today: gain(day, now),
				ytd:   gain(ytd, now),
			}
		},
		error =>
		{
			if (error.code === 'brokerage_not_exist_for_date')
			{
				return {
					today: null,
					ytd: null
				}
			}
			else
			{
				throw error
			}
		})

		function gain (from, to)
		{
			return round((to.indexed / from.indexed) * 100 - 100, 3)
		}
	})

	var fullValue = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return Promise.all(
			[
				brokerage.byId(trx, investor_id, for_date, { future: true }),
				holdings.byId
					.quotes(trx, investor_id, for_date, { soft: true, other: true })
			])
			.then(values =>
			{
				var cash = values[0].cash
				var multiplier = values[0].multiplier

				var holdings = values[1]

				var allocation = cash + sumBy(holdings, 'real_allocation')

				return {
					real:    allocation,
					indexed: allocation * multiplier
				}
			})
			.catch(err =>
			{
				if (err.code === 'brokerage_not_exist_for_date')
				{
					return {
						real:    0,
						indexed: 0
					}
				}
			})
		})
	})


	portfolio.grid = knexed.transact(knex, (trx, investor_id) =>
	{
		return Promise.all(
		[
			grid(trx, investor_id, 'day'),
			grid(trx, investor_id, 'intraday')
		])
		.then(points =>
		{
			var y2 = points[0]
			var intraday = points[1]

			var utc_offset = intraday.utc_offset
			delete intraday.utc_offset

			return [
				{ period: 'y2', points: y2 },
				{ period: 'today', utcOffset: utc_offset, points: intraday }
			]
		})
	})

	portfolio.grid.ir = knexed.transact(knex, (trx, investor_id) =>
	{
		return grid.ir(trx, investor_id, 'day')
		.then(it => [ it ])
		.catch(err =>
		{
			if (Err.is(err))
			{
				console.error(err.code)
				console.error(err.message)
				console.error(err.data)
			}
			else
			{
				console.error(err.message)
			}

			return []
		})
	})



	var WrongTradeDir = Err('wrong_trade_dir', 'Wrong Trade Dir')

	holdings.dirs = {}
	holdings.dirs.bought = holdings.buy
	holdings.dirs.sold = holdings.sell

	var PostDateErr =
		Err('there_is_more_recent_state',
			'There Is More Recent State')

	portfolio.isDateAvail = function (trx, investor_id, date)
	{
		return Promise.all(
		[
			holdings.isDateAvail(trx, investor_id, date),
			brokerage.isDateAvail(trx, investor_id, date)
		])
		.then(so =>
		{
			return so[0] && so[1]
		})
	}

	portfolio.availableDate = knexed.transact(knex, (trx, investor_id) =>
	{
		return Promise.all(
		[
			holdings.availableDate(trx, investor_id),
			brokerage.availableDate(trx, investor_id)
		])
		.then(r =>
		{
			var dates_symbols  = r[0]
			var date_brokerage = r[1]

			var max_symbols = maxBy(dates_symbols, 'available_from')
			if (max_symbols)
			{
				max_symbols = max_symbols.available_from
			}

			var max_brokerage = date_brokerage.available_from

			var max_common = null
			if (max_symbols || max_brokerage)
			{
				max_common = max([ max_symbols || -1, max_brokerage || -1 ])
				max_common = moment.utc(max_common)
			}

			return max_common
		})
	})

	portfolio.adjustDate = knexed.transact(knex, (trx, investor_id, timestamp) =>
	{
		expect(timestamp).ok
		timestamp = moment.utc(timestamp)

		return portfolio.availableDate(trx, investor_id)
		.then(portfolio_date =>
		{
			if (timestamp > portfolio_date)
			{
				return timestamp.format()
			}

			if (timestamp.isSameOrAfter(portfolio_date.clone().startOf('day')))
			{
				return portfolio_date.add(5, 'minutes').format()
			}

			return timestamp.format()
			// Do Nothing. Will create error 'Wrong Date'
			// Or, in feature, will insert between to date
		})
	})


	portfolio.makeTrade = function (trx, investor_id, type, date, data)
	{
		var dir = data.dir
		var symbol = {}

		return portfolio.adjustDate(trx, investor_id, date)
		.then(for_date =>
		{
			return portfolio.isDateAvail(trx, investor_id, for_date)
			.then(is_avail =>
			{
				if (! is_avail)
				{
					throw PostDateErr()
				}

				return Symbl.validate(data.symbol)
			})
			.then(symbl =>
			{
				symbol = symbl

				if (! (dir in holdings.dirs))
				{
					throw WrongTradeDir({ dir: dir })
				}

				if (data.is_delete)
				{
					for_date = moment()
				}

				return holdings.dirs[dir](trx, investor_id, symbol, for_date, data)
			})
			.then(sum =>
			{
				return brokerage.update(trx, investor_id, for_date,
				{
					operation: 'trade',
					amount: sum
				})
			})
		})
	}

	portfolio.removeTrade = function (trx, post)
	{
		var symbol = post.data.symbol

		symbol.symbol_ticker = symbol.ticker
		symbol.symbol_exchange = symbol.exchange

		return portfolio.isDateAvail(trx, post.investor_id, post.timestamp)
		.then(is_avail =>
		{
			if (! is_avail)
			{
				throw PostDateErr()
			}
		})
		.then(() =>
		{
			return holdings.symbolById(trx, symbol, post.investor_id, null, {
				raw_select: true
			})
		})
		.then(symbol_state =>
		{
			return holdings.removeBySymbolState(trx, symbol_state)
		})
		.then(() =>
		{
			return brokerage.removeState(trx, post.investor_id, post.timestamp)
		})
	}


	var val_cash_ops = validate.collection([
		'deposit',
		'withdraw',
		'fee',
		'interest'
	])

	portfolio.manageCash = knexed.transact(knex, (trx, investor_id, op) =>
	{
		validate.required(op.type, 'type')
		val_cash_ops(op.type) // 'type'

		validate.required(op.cash, 'cash')
		validate.number(op.cash, 'cash')

		validate.required(op.date, 'date')
		validate.date(op.date) // 'date'

		return portfolio.adjustDate(trx, investor_id, op.date)
		.then(for_date =>
		{
			return brokerage.update(trx, investor_id, for_date,
			{
				operation: op.type,
				amount: op.cash
			})
		})
		.then(noop)
	})

	var Emitter = db.notifications.Emitter

	var CashManaged = Emitter('cash_managed')

	portfolio.manageCashAs = knexed.transact(
		knex,
		(trx, whom_id, investor_id, data) =>
	{
		return portfolio.manageCash(trx, investor_id, data)
		.then(() =>
		{
			return CashManaged(investor_id,
			{
				admin: [ ':user-id', whom_id ],
				investor_id: [ ':user-id', investor_id ],
			})
		})
		.then(noop)
	})


	extend(portfolio, Parser(portfolio, db))

	return portfolio
}

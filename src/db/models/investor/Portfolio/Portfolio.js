
var pick = require('lodash/pick')
var extend = require('lodash/extend')

var noop = require('lodash/noop')

var reduce = require('lodash/reduce')

var sumBy = require('lodash/sumBy')
var orderBy = require('lodash/orderBy')

var round = require('lodash/round')

var moment = require('moment')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var Brokerage = require('./Brokerage')
var Holdings  = require('./Holdings')

var Tradeops  = require('./Tradeops')

var Grid = require('./Grid/Grid')

var Symbl = require('../../symbols/Symbl')

var Err = require('../../../../Err')

var Parser = require('./Parser')

var NonTradeOp = require('./TradeOp/NonTradeOp')

module.exports = function Portfolio (db, investor)
{
	var portfolio = {}

	var brokerage = portfolio.brokerage = Brokerage(db, investor, portfolio)
	var holdings  = portfolio.holdings  =  Holdings(db, investor, portfolio)

	expect(db, 'Portfolio depends on Series').property('symbols')
	portfolio.symbols = db.symbols

	var tradeops  = portfolio.tradeops = Tradeops(db, portfolio)

	var grid = Grid(investor, portfolio)

	var knex = db.knex

	// get
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
			 + sumBy(total_holdings, 'allocation')

			var cash_row =
			{
				symbol: Symbl('CASH.CASH').toFull(),
				allocation: brokerage.cash * brokerage.multiplier,
				gain: null,
				price: 1,
				amount: 1,
			}

			total_holdings = [ cash_row ].concat(total_holdings)

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
			fullValue(trx, investor_id, null),
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


	// involved symbols
	// TODO maybe not in use
	portfolio.allSymbolsInvolved = () =>
	{
		return holdings.allSymbolsInvolved()
	}


	// grid
	portfolio.grid = knexed.transact(knex, (trx, investor_id) =>
	{
		return Promise.all(
		[
			grid(trx, investor_id, 'day'),
			grid(trx, investor_id, 'intraday'),
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


	// tradeop
	portfolio.apply = knexed.transact(knex, (trx, tradeop) =>
	{
		return tradeops.apply(trx, tradeop)
		.catch(err =>
		{
			if (Err.is(err))
			{
				throw PortfolioOpErr({ reason: err })
			}
			else
			{
				console.trace(err.stack)
				throw PortfolioOpErr({ reason: err.message })
			}
		})
	})

	var PortfolioOpErr = Err('portfolio_operation_err',
		'Error appeared during munipulating portofilo'
	)


	// trading
	var WrongTradeDir = Err('wrong_trade_dir', 'Wrong Trade Dir')

	holdings.dirs = {}
	holdings.dirs.bought = holdings.buy
	holdings.dirs.sold = holdings.sell

	portfolio.availableDate = knexed.transact(knex, (trx, investor_id) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return tradeops.availableDate(trx, investor_id)
		})
	})

	portfolio.makeTrade = function (trx, investor_id, type, timestamp, data)
	{
		var dir = data.dir
		var symbol = {}

		return Symbl.validate(data.symbol)
		.then(symbl =>
		{
			symbol = symbl

			if (! (dir in holdings.dirs))
			{
				throw WrongTradeDir({ dir: dir })
			}

			return holdings.dirs[dir](trx, investor_id, symbol, timestamp, data)
		})
		.then(sum =>
		{
			return brokerage.update(trx, investor_id, timestamp,
			{
				operation: 'trade',
				amount: sum
			})
		})
	}

	portfolio.removeTrade = function (trx, post)
	{
		var symbol = post.op_data.symbol
		var investor_id = post.investor_id
		var timestamp = post.timestamp

		return holdings.symbolById(
			trx,
			symbol,
			investor_id,
			timestamp.format(),
			{
				with_timestamp: true,
				include_zero: true,
			}
		)
		.then(holding_pk =>
		{
			return holdings.remove(trx, holding_pk)
		})
		.then(() =>
		{
			return brokerage.remove(trx, investor_id, timestamp)
		})
	}


	portfolio.manageCash = knexed.transact(knex, (trx, investor_id, op) =>
	{
		var non_trade_op = NonTradeOp(investor_id, moment.utc(op.date).toDate(),
		{
			type: op.type,
			amount: op.cash,
		})

		return portfolio.apply(trx, non_trade_op)
		.then(noop)
	})

	var Emitter = db.notifications.Emitter

	var CashManaged = Emitter('cash_managed')

	portfolio.manageCashAs = knexed.transact(
		knex,
		(trx, whom_id, investor_id, data) =>
	{
		return investor.all.ensure(investor_id)
		.then(() => investor.getActionMode(trx, whom_id, investor_id))
		.then(mode =>
		{
			if (mode === 'mode:admin') { return mode }

			db.post.check_operation_date(data.date)

			return mode
		})
		.then((mode) =>
		{
			return portfolio.manageCash(trx, investor_id, data)
			.then(() => mode)
		})
		.then((mode) =>
		{
			if (mode === 'mode:admin')
			{
				return CashManaged(investor_id,
				{
					admin: [ ':user-id', whom_id ],
					investor_id: [ ':user-id', investor_id ],
				}, trx)
			}
		})
		.then(noop)
	})


	extend(portfolio, Parser(portfolio, db))

	return portfolio
}

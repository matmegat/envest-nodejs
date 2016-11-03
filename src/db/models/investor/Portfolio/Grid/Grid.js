

var moment = require('moment')
var MRange = require('moment-range/lib/moment-range')


var get = require('lodash/get')
var values = require('lodash/values')

var any = require('lodash/some')
var isEmpty = require('lodash/isEmpty')

var forOwn = require('lodash/forOwn')
var mapValues = require('lodash/mapValues')
var flatten = require('lodash/flatten')

var round = require('lodash/round')

var find = require('lodash/find')
var findLast = require('lodash/findLast')

var min = require('lodash/min')


module.exports = function Grid (investor, portfolio)
{
	var holdings  = portfolio.holdings
	var brokerage = portfolio.brokerage
	var symbols   = portfolio.symbols

	function grid (trx, investor_id, resolution)
	{
		return grid_ir(trx, investor_id, resolution)
		.then(grid => grid.chart)
		.then(chart =>
		{
			if (chart.utc_offset)
			{
				var utc_offset = chart.utc_offset
				delete chart.utc_offset
			}

			chart = chart.map(entry =>
			{
				return {
					timestamp: entry[0],
					value: entry[1]
				}
			})

			if (utc_offset)
			{
				chart.utc_offset = utc_offset
			}

			return chart
		})
	}

	var grid_ir = grid.ir = function grid_ir (trx, investor_id, resolution)
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			return Promise.all(
			[
				holdings.grid(trx, investor_id, resolution),
				brokerage.grid(trx, investor_id, resolution)
			])
		})
		.then(grids =>
		{
			var grid = {}

			grid.resolution = resolution

			grid.holdings  = grids[0]
			grid.brokerage = grids[1]

			var range = max_range(
				grid.brokerage.daterange,
				grid.holdings.daterange
			)

			range = range_from(range, moment(), resolution)

			return grid_series(grid.holdings.involved, range, resolution)
			// eslint-disable-next-line max-statements
			.then(superseries =>
			{
				/* pick single last trading day */
				range = range_correct_day(range, superseries, resolution)

				/* correct range to trading hours */
				range = find_market_open(range, superseries, resolution)

				if (0 && resolution === 'day')
				{
					console.dir(grid)
					console.log('--- holdings:')
					console.dir(grid.holdings.datadays, 3)
					console.log('--- brokerage:')
					console.dir(grid.brokerage.datadays)
					console.log('--- range:')
					console.log(range.start.format(), range.end.format())

					console.log('--- series:')
					if (resolution === 'day')
					{
						console.dir(superseries, 3)
					}
					else
					{
						var intrs = mapValues(superseries, v =>
						({
							all:  v.length,
							last: v.slice(-5)
						}))
						console.dir(intrs, 3)
					}
				}

				grid.range = range
				grid.superseries = superseries
			})
			.then(() =>
			{
				var chart = []

				// range.by('days', it =>
				grid_iterator(range, resolution, it =>
				{
					var iso = it.toISOString()

					var c_brokerage
					 = find_brokerage(grid.brokerage.datadays, iso)

					var total = c_brokerage.cash * c_brokerage.multiplier

					var c_holdings
					 = find_holding_day(grid.holdings.datadays, iso)

					if (c_holdings)
					{
						forOwn(c_holdings, holding =>
						{
							var price
							 = find_series_value(grid.superseries, holding, iso)

							var wealth
							 = price * holding.amount * c_brokerage.multiplier

							total += wealth
						})
					}

					total = round(total, 3)

					chart.push([ moment(iso).utc().format(), total ])
				})

				if (resolution === 'intraday')
				{
					var utc_offset = mapValues(grid.superseries, series =>
					{
						return get(series, '0.utcOffset', null)
					})

					utc_offset = values(utc_offset)

					utc_offset = min(utc_offset)

					chart.utc_offset = utc_offset
				}

				grid.chart = chart

				return grid
			})
		})
	}

	function max_range (brokerage, holdings)
	{
		brokerage = new MRange(brokerage)

		if (holdings)
		{
			holdings = new MRange(holdings)
		}

		var start = brokerage.start
		var end   = brokerage.end

		if (holdings && holdings.end.isValid())
		{
			end = moment.max(brokerage.end, holdings.end)
		}

		return new MRange(start, end)
	}

	function range_from (range, end, resolution)
	{
		end = moment(end).startOf('day').add(1, 'day')

		if (resolution === 'day')
		{
			var start = moment(end)
			.subtract(2, 'years')
		}
		else
		{
			var start = moment(end)
			.subtract(5 + 1, 'days')
		}

		start = moment.max(range.start, start)

		return new MRange(start, end)
	}

	function range_correct_day (range, superseries, resolution)
	{
		if (resolution !== 'intraday') { return range }
		if (isEmpty(superseries)) { return range }

		var day = moment(range.end).startOf('day')
		var r

		while (day >= range.start)
		{
			r = find_for_day(day)

			if (r) { break }

			day.subtract(1, 'day')
		}

		return new MRange(day, moment(day).add(1, 'day'))

		function find_for_day (day)
		{
			day = moment(day).toISOString()

			var rs = mapValues(superseries, series =>
			{
				return findLast(series, tick =>
				{
					var ts = moment(tick.timestamp).toISOString()
					return ts > day
				})
			})

			rs = values(rs)

			rs = any(rs)

			return rs
		}
	}

	function find_market_open (range, superseries, resolution)
	{
		if (resolution !== 'intraday') { return range }

		superseries = values(superseries)
		superseries = flatten(superseries)

		if (! superseries.length) { return range }

		var day = moment(range.start)
		.startOf('day')
		.toISOString()

		var start = find(superseries, same_day)
		var end   = findLast(superseries, same_day)

		start = start.timestamp
		end   = end.timestamp

		return new MRange(start, end)

		function same_day (tick)
		{
			var tick_day = moment(tick.timestamp)
			.startOf('day')
			.toISOString()

			return tick_day === day
		}
	}

	function grid_series (involved, range, resolution)
	{
		if (resolution === 'day')
		{
			var queries = involved.map(
				symbol => symbols.seriesForPortfolio(symbol, range)
			)
		}
		else
		{
			var queries = involved.map(
				symbol => symbols.seriesForPortfolio
					.intraday(symbol, range)
			)
		}

		return Promise.all(queries)
		.then(batch =>
		{
			var r = {}

			batch.forEach((data, i) =>
			{
				var symbol = involved[i]

				r[symbol] = data
			})

			return r
		})
	}

	function grid_iterator (range, resolution, fn)
	{
		// SYNC:
		// return range.by('days', fn)

		if (resolution === 'day')
		{
			var incr = () => { next.add(1, 'day') }
		}
		else
		{
			var incr = () => { next.add(5, 'minutes') }
		}

		var next = moment(range.start)

		while (next <= range.end)
		{
			fn(next)

			incr()
		}
	}

	function find_brokerage (brokerage, date)
	{
		/* ISO dates are sortable */
		var entry = findLast(brokerage, entry => entry[0] <= date)

		if (entry)
		{
			return entry[1]
		}
		else
		{
			throw TypeError('brokerage_error')
		}
	}

	function find_holding_day (holdings, date)
	{
		/* ISO dates are sortable */
		var entry = findLast(holdings, entry => entry[0] <= date)

		if (entry)
		{
			return entry[1]
		}
		else
		{
			return null // NO trades at all
		}
	}

	function find_series_value (series, holding, day)
	{
		var symbol = holding.symbol

		if (symbol.isOther())
		{
			return holding.price
		}

		series = series[symbol]

		/* ISO dates are sortable */
		var entry = findLast(series, tick =>
		{
			var ts = moment(tick.timestamp).toISOString()
			return ts <= day
		})

		if (entry)
		{
			return entry.value
		}
		else
		{
			console.warn(
				'XIGN error, no data for Investor Chart {%s, %s}',
				symbol, day
			)

			return 0
		}
	}

	return grid
}

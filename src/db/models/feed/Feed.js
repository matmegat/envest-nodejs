
var expect = require('chai').expect

var _ = require('lodash')

var knexed = require('../../knexed')

var PaginatorChunked = require('../../paginator/Chunked')
var PaginatorBooked  = require('../../paginator/Booked')
var Filter = require('../../Filter')
var Sorter = require('../../Sorter')

var Err = require('../../../Err')
var NotFound = Err('feed_not_found', 'Feed item not found')
var WrongFeedId = Err('wrong_feed_id', 'Wrong feed id')

var invoke = require('lodash/invokeMap')

var map = require('lodash/fp/map')

// eslint-disable-next-line max-statements
var Feed = module.exports = function Feed (db)
{
	var feed = {}

	var knex = db.knex
	var one = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe
	var count = db.helpers.count

	feed.feed_table = knexed(knex, 'feed_items')

	expect(db, 'Feed depends on Comments').property('comments')
	var comments = db.comments

	expect(db, 'Feed depends on Investor').property('investor')
	var investor = db.investor

	expect(db, 'Feed depends on Symbols').property('symbols')
	var symbols = db.symbols

	expect(db, 'Feed depends on Subscription').property('subscr')
	var subscr = db.subscr

	expect(db, 'Feed depends on Watchlist').property('watchlist')
	var watchlist = db.watchlist

	var paginators = {}

	paginators.chunked = PaginatorChunked(
	{
		table: feed.feed_table
	})

	paginators.booked = PaginatorBooked()

	var sorter = Sorter(
	{
		order_column: 'timestamp',
		allowed_columns: ['timestamp']
	})

	var filter = Filter(
	{
		type: Filter.by.equal('type'),
		investor: Filter.by.id('investor_id'),
		investors: Filter.by.ids('investor_id'),
		last_days: Filter.by.days('timestamp'),
		last_weeks: Filter.by.weeks('timestamp'),
		last_months: Filter.by.months('timestamp'),
		last_years: Filter.by.years('timestamp'),
		name: Filter.by.name('feed_items.investor_id'),
		mindate: Filter.by.mindate('timestamp'),
		maxdate: Filter.by.maxdate('timestamp'),
		symbols: Filter.by.symbols(),
	})

	feed.NotFound = NotFound

	feed.byId = function (id)
	{
		return feed.validateFeedId(id)
		.then(() =>
		{
			return feed.feed_table()
			.where('id', id)
		})
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
		.then((feed_item) =>
		{
			return investor.public.byId(feed_item.investor_id)
			.then((investor) =>
			{
				feed_item.investor = _.pick(investor,
				[
					'id',
					'first_name',
					'last_name',
					'pic'
				])
				delete feed_item.investor_id

				transform_event(feed_item)

				return transform_symbols([ feed_item ], symbols)
				.then(it => it[0])
			})
		})
		.then((feed_item) =>
		{
			return comments.count(feed_item.id)
			.then((count) =>
			{
				feed_item.comments = count

				return feed_item
			})
		})
	}

	feed.validateFeedId = require('../../../id').validate.promise(WrongFeedId)

	feed.list = function (options, user_id)
	{
		options.paginator = _.extend({}, options.paginator,
		{
			order_column: 'feed_items.id'
		})

		var queryset = feed.feed_table()

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()

		var paginator

		if (options.paginator.page)
		{
			paginator = paginators.booked
		}
		else
		{
			paginator = paginators.chunked
		}

		return subscr.isAble(user_id, 'multiple_investors')
		.then((subscr_item) =>
		{
			if (! subscr_item)
			{
				return investor.featured.get()
				.then((item) =>
				{
					queryset
					.where('investor_id', item.investor_id)

					count_queryset = queryset.clone()

					queryset = sorter.sort(queryset)
				})
			}
			else
			{
				queryset = sorter.sort(queryset)
			}
		})
		.then(() =>
		{
			queryset.select(
			'feed_items.id',
			'feed_items.timestamp',
			'feed_items.investor_id',
			'feed_items.type',
			'feed_items.data')

			return paginator.paginate(queryset, options.paginator)
		})
		.then((feed_items) =>
		{
			var feed_ids = _.map(feed_items, 'id')

			return comments
			.countMany(feed_ids)
			.then(counts =>
			{
				feed_items.forEach((item) =>
				{
					item.comments = counts[item.id]
					transform_event(item)
				})

				return transform_symbols(feed_items, symbols)
			})
		})
		.then((feed_items) =>
		{
			return investor.public.list(
			{
				filter: { ids: _.map(feed_items, 'investor_id').join(',') }
			})
			.then((investors) =>
			{
				var response =
				{
					feed: feed_items,
					investors: investors.investors,
				}

				if (paginator.total)
				{
					return count(count_queryset)
					.then(count =>
					{
						return paginator.total(response, count)
					})
				}

				return response
			})
		})
	}

	feed.byWatchlist = function (user_id, options)
	{
		return watchlist.user.byId(user_id)
		.then(map('symbol'))
		.then(symbols =>
		{
			symbols = invoke(symbols, 'toXign')
			symbols = symbols.join(',')

			options.filter.symbols = symbols

			return feed.list(options, user_id)
		})
	}

	feed.counts = function (options)
	{
		return Promise.all(
		[
			count_by(options, 'trade'),
			count_by(options, 'watchlist'),
			count_by(options, 'update'),
		])
		.then(counts =>
		{
			return {
				trades:     counts[0],
				watchlists: counts[1],
				updates:    counts[2]
			}
		})
	}

	function count_by (options, type)
	{
		options.type = type

		return count(filter(feed.feed_table(), options))
	}

	feed.postByInvestor = function (trx, id, investor_id)
	{
		return feed.feed_table(trx)
		.where(
		{
			investor_id: investor_id,
			id: id
		})
		.then(oneMaybe)
	}

	function create (trx, investor_id, type, date, data)
	{
		return feed.feed_table(trx)
		.insert({
			investor_id: investor_id,
			type: type,
			timestamp: date,
			data: data
		}, 'id')
		.then(one)
	}

	function update (trx, investor_id, type, date, data, post_id)
	{
		return feed.feed_table(trx)
		.where('id', post_id)
		.update({
			timestamp: date,
			data: data
		}, 'id')
		.then(one)
	}

	feed.remove = function (trx, investor_id, post_id)
	{
		return feed.feed_table(trx)
		.where({
			id: post_id,
			investor_id: investor_id
		})
		.del()
		.then(_.noop)
	}

	feed.upsert = function (trx, investor_id, type, date, data, post_id)
	{
		if (post_id)
		{
			return update(trx, investor_id, type, date, data, post_id)
		}
		else
		{
			return create(trx, investor_id, type, date, data)
		}
	}

	return feed
}


function transform_event (item)
{
	item.event = {
		type: item.type,
		data: item.data
	}

	delete item.type
	delete item.data

	mock_chart(item)
}


function transform_symbols (items, api)
{
	var symbols = Feed.symbolsInvolved(items)

	return api.resolveMany(symbols, true)
	.then(compact)
	.then(symbols =>
	{
		return items.map(replace_symbol(symbols))
	})
}


var compact = _.compact
var flatten = _.flatten
var uniqBy  = _.uniqBy

var Symbl = require('../symbols/Symbl')

Feed.symbolsInvolved = (items) =>
{
	var symbols = items.map(item =>
	{
		var data = item.event.data

		if (data.symbol)
		{
			return data.symbol
		}
		if (data.symbols)
		{
			return data.symbols
		}
	})

	symbols = flatten(symbols)
	symbols = compact(symbols)

	symbols = symbols.map(symbol =>
	{
		return Symbl([ symbol.ticker, symbol.exchange ])
	})

	symbols = uniqBy(symbols, symbol => symbol.toXign())

	return symbols
}


var find = _.find
var curry = _.curry

var replace_symbol = curry((symbols, item) =>
{
	var pick = pick_symbol(symbols)

	var data = item.event.data

	if (data.symbol)
	{
		data.symbol = pick(data.symbol)
	}
	if (data.symbols)
	{
		data.symbols = data.symbols.map(pick)
	}

	return item
})

var pick_symbol = curry((symbols, item_s) =>
{
	var symbol = find(symbols, s =>
	{
		return Symbl.equals(s, item_s)
	})

	if (! symbol)
	{
		return item_s
	}

	return symbol
})


// @@TODO implement, rm mock
function mock_chart (item)
{
	var event = item.event

	var type = event.type
	var data = event.data

	if (type !== 'update')
	{
		return
	}
	if (data.pic)
	{
		return
	}
	/*if (event.id % 2)
	{
		return
	}*/

	data.chart =
	{
		symbol:
		{
			full: 'TSLA.XNAS',
			ticker: 'TSLA',
			exchange: 'XNAS',
			company: 'Tesla Motors, Inc.'
		},

		// guarantee present `graph_as`
		// for now `graph_as` = `timestamp`
		// but can be changed in later requirements
		graph_as: item.timestamp,
		series: null
	}

	// eslint-disable-next-line
	data.chart.series = { period: 'today', points: [{"timestamp":"2016-08-15T13:30:00Z","utcOffset":-4,"value":108.76},{"timestamp":"2016-08-15T13:35:00Z","utcOffset":-4,"value":108.78},{"timestamp":"2016-08-15T13:40:00Z","utcOffset":-4,"value":108.87},{"timestamp":"2016-08-15T13:45:00Z","utcOffset":-4,"value":108.99},{"timestamp":"2016-08-15T13:50:00Z","utcOffset":-4,"value":109.075},{"timestamp":"2016-08-15T13:55:00Z","utcOffset":-4,"value":108.95},{"timestamp":"2016-08-15T14:00:00Z","utcOffset":-4,"value":109.03},{"timestamp":"2016-08-15T14:05:00Z","utcOffset":-4,"value":109.05},{"timestamp":"2016-08-15T14:10:00Z","utcOffset":-4,"value":109.105},{"timestamp":"2016-08-15T14:15:00Z","utcOffset":-4,"value":109.21},{"timestamp":"2016-08-15T14:20:00Z","utcOffset":-4,"value":109.321},{"timestamp":"2016-08-15T14:25:00Z","utcOffset":-4,"value":109.32},{"timestamp":"2016-08-15T14:30:00Z","utcOffset":-4,"value":109.335},{"timestamp":"2016-08-15T14:35:00Z","utcOffset":-4,"value":109.31},{"timestamp":"2016-08-15T14:40:00Z","utcOffset":-4,"value":109.32},{"timestamp":"2016-08-15T14:45:00Z","utcOffset":-4,"value":109.255},{"timestamp":"2016-08-15T14:50:00Z","utcOffset":-4,"value":109.25},{"timestamp":"2016-08-15T14:55:00Z","utcOffset":-4,"value":109.275},{"timestamp":"2016-08-15T15:00:00Z","utcOffset":-4,"value":109.25},{"timestamp":"2016-08-15T15:05:00Z","utcOffset":-4,"value":109.233},{"timestamp":"2016-08-15T15:10:00Z","utcOffset":-4,"value":109.3},{"timestamp":"2016-08-15T15:15:00Z","utcOffset":-4,"value":109.405},{"timestamp":"2016-08-15T15:20:00Z","utcOffset":-4,"value":109.46},{"timestamp":"2016-08-15T15:25:00Z","utcOffset":-4,"value":109.515},{"timestamp":"2016-08-15T15:30:00Z","utcOffset":-4,"value":109.47},{"timestamp":"2016-08-15T15:35:00Z","utcOffset":-4,"value":109.468},{"timestamp":"2016-08-15T15:40:00Z","utcOffset":-4,"value":109.475},{"timestamp":"2016-08-15T15:45:00Z","utcOffset":-4,"value":109.366},{"timestamp":"2016-08-15T15:50:00Z","utcOffset":-4,"value":109.33},{"timestamp":"2016-08-15T15:55:00Z","utcOffset":-4,"value":109.319},{"timestamp":"2016-08-15T16:00:00Z","utcOffset":-4,"value":109.344},{"timestamp":"2016-08-15T16:05:00Z","utcOffset":-4,"value":109.359},{"timestamp":"2016-08-15T16:10:00Z","utcOffset":-4,"value":109.32},{"timestamp":"2016-08-15T16:15:00Z","utcOffset":-4,"value":109.31},{"timestamp":"2016-08-15T16:20:00Z","utcOffset":-4,"value":109.37},{"timestamp":"2016-08-15T16:25:00Z","utcOffset":-4,"value":109.36},{"timestamp":"2016-08-15T16:30:00Z","utcOffset":-4,"value":109.405},{"timestamp":"2016-08-15T16:35:00Z","utcOffset":-4,"value":109.38},{"timestamp":"2016-08-15T16:40:00Z","utcOffset":-4,"value":109.39},{"timestamp":"2016-08-15T16:45:00Z","utcOffset":-4,"value":109.36},{"timestamp":"2016-08-15T16:50:00Z","utcOffset":-4,"value":109.33},{"timestamp":"2016-08-15T16:55:00Z","utcOffset":-4,"value":109.385},{"timestamp":"2016-08-15T17:00:00Z","utcOffset":-4,"value":109.383},{"timestamp":"2016-08-15T17:05:00Z","utcOffset":-4,"value":109.311},{"timestamp":"2016-08-15T17:10:00Z","utcOffset":-4,"value":109.324},{"timestamp":"2016-08-15T17:15:00Z","utcOffset":-4,"value":109.35},{"timestamp":"2016-08-15T17:20:00Z","utcOffset":-4,"value":109.312},{"timestamp":"2016-08-15T17:25:00Z","utcOffset":-4,"value":109.303},{"timestamp":"2016-08-15T17:30:00Z","utcOffset":-4,"value":109.22},{"timestamp":"2016-08-15T17:35:00Z","utcOffset":-4,"value":109.28},{"timestamp":"2016-08-15T17:40:00Z","utcOffset":-4,"value":109.31},{"timestamp":"2016-08-15T17:45:00Z","utcOffset":-4,"value":109.29},{"timestamp":"2016-08-15T17:50:00Z","utcOffset":-4,"value":109.27},{"timestamp":"2016-08-15T17:55:00Z","utcOffset":-4,"value":109.275},{"timestamp":"2016-08-15T18:00:00Z","utcOffset":-4,"value":109.29},{"timestamp":"2016-08-15T18:05:00Z","utcOffset":-4,"value":109.305},{"timestamp":"2016-08-15T18:10:00Z","utcOffset":-4,"value":109.265},{"timestamp":"2016-08-15T18:15:00Z","utcOffset":-4,"value":109.245},{"timestamp":"2016-08-15T18:20:00Z","utcOffset":-4,"value":109.275},{"timestamp":"2016-08-15T18:25:00Z","utcOffset":-4,"value":109.275},{"timestamp":"2016-08-15T18:30:00Z","utcOffset":-4,"value":109.286},{"timestamp":"2016-08-15T18:35:00Z","utcOffset":-4,"value":109.315},{"timestamp":"2016-08-15T18:40:00Z","utcOffset":-4,"value":109.315},{"timestamp":"2016-08-15T18:45:00Z","utcOffset":-4,"value":109.37},{"timestamp":"2016-08-15T18:50:00Z","utcOffset":-4,"value":109.405},{"timestamp":"2016-08-15T18:55:00Z","utcOffset":-4,"value":109.38},{"timestamp":"2016-08-15T19:00:00Z","utcOffset":-4,"value":109.355},{"timestamp":"2016-08-15T19:05:00Z","utcOffset":-4,"value":109.355},{"timestamp":"2016-08-15T19:10:00Z","utcOffset":-4,"value":109.343},{"timestamp":"2016-08-15T19:15:00Z","utcOffset":-4,"value":109.4},{"timestamp":"2016-08-15T19:20:00Z","utcOffset":-4,"value":109.345},{"timestamp":"2016-08-15T19:25:00Z","utcOffset":-4,"value":109.443},{"timestamp":"2016-08-15T19:30:00Z","utcOffset":-4,"value":109.43},{"timestamp":"2016-08-15T19:35:00Z","utcOffset":-4,"value":109.455},{"timestamp":"2016-08-15T19:40:00Z","utcOffset":-4,"value":109.51},{"timestamp":"2016-08-15T19:45:00Z","utcOffset":-4,"value":109.485},{"timestamp":"2016-08-15T19:50:00Z","utcOffset":-4,"value":109.509},{"timestamp":"2016-08-15T19:55:00Z","utcOffset":-4,"value":109.51},{"timestamp":"2016-08-15T20:00:00Z","utcOffset":-4,"value":109.51},{"timestamp":"2016-08-15T20:15:00Z","utcOffset":-4,"value":109.48}] }

	return
}

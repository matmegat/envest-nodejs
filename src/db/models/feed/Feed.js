
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

var noop = require('lodash/noop')

// eslint-disable-next-line max-statements
var Feed = module.exports = function Feed (db)
{
	var feed = {}

	var knex = db.knex
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
			{	// TODO: replace to Filter by ids
				where:
				{
					column_name: 'user_id',
					clause: 'in',
					argument: _.map(feed_items, 'investor_id')
				}
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

	feed.create = function (trx, investor_id, type, date, data)
	{
		return feed.feed_table(trx)
		.insert({
			investor_id: investor_id,
			type: type,
			timestamp: date,
			data: data
		})
		.then(noop)
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

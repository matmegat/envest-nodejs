
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
var find   = require('lodash/find')
var omit   = require('lodash/omit')

var map = require('lodash/fp/map')

// eslint-disable-next-line max-statements
var Feed = module.exports = function Feed (db)
{
	var feed = {}

	var knex = db.knex
	var one = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe
	var count = db.helpers.count
	var raw = knex.raw

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
		allowed_columns: [ 'timestamp' ]
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

	feed.byId = function (id, user_id)
	{
		var queryset = feed.feed_table().select('feed_items.*')

		return feed.validateFeedId(id)
		.then(() => update_queryset(queryset, user_id))
		.then(() => queryset.where('id', id))
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
		.then((feed_item) => transform_items([ feed_item ], user_id))
		.then((feed_items) => feed_items[0])
		.then((feed_item) =>
		{
			feed_item.investor = _.pick(feed_item.investor,
			[
				'id',
				'first_name',
				'last_name',
				'pic'
			])

			return comments.count(feed_item.id)
			.then((count) =>
			{
				feed_item.comments = count

				return feed_item
			})
		})
	}

	function index_feed_item (item, user_id)
	{
		expect(item).to.be.an('object')
		expect(user_id).to.be.a('number')

		if (item.event.type !== 'trade' || item.investor_id === user_id)
		{
			return Promise.resolve(item)
		}

		return db.admin.is(user_id)
		.then(so =>
		{
			if (so) { return item }

			return investor.portfolio.brokerage.byId(item.investor_id)
			.then(brokerage =>
			{
				item.event.data.amount *= brokerage.multiplier

				return item
			})
		})
	}

	function transform_items (items, user_id)
	{
		expect(items).to.be.an('array')
		expect(user_id).to.be.a('number')

		return Promise.all(items.map(item =>
		{
			transform_event(item)

			return index_feed_item(item, user_id)
		}))
		.then(items => transform_symbols(items, symbols))
		.then(items =>
		{
			return investor.all.list(
			{
				filter: { ids: pick_feed_investors(items).join(',') }
			})
			.then(investors => investors.investors)
			.then(investors =>
			{
				items.forEach(item =>
				{
					item.investor = find(investors, { id: item.investor_id })
				})

				return items
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

		var count_queryset

		var paginator

		if (options.paginator.page)
		{
			paginator = paginators.booked
		}
		else
		{
			paginator = paginators.chunked
		}

		return update_queryset(queryset, user_id)
		.then((is_full_access) =>
		{
			if (! is_full_access)
			{
				return investor.featured.get()
				.then((item) =>
				{
					queryset
					.where('investor_id', item.investor_id)
				})
			}
		})
		.then(() =>
		{
			count_queryset = queryset.clone()

			queryset = sorter.sort(queryset)
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
		.then((feed_items) => transform_items(feed_items, user_id))
		.then((feed_items) =>
		{
			var feed_ids = pick_feed_ids(feed_items)

			return comments
			.countMany(feed_ids)
			.then(counts =>
			{
				feed_items.forEach((item) =>
				{
					item.comments = counts[item.id]
				})

				return feed_items
			})
		})
		.then(feed_items =>
		{
			var investors = feed_items.map(entry  => entry.investor)
			investors = _.uniqBy(investors, 'id')

			var response =
			{
				feed: feed_items.map(entry => omit(entry, 'investor')),
				investors: investors.map(entry => omit(entry, 'brokerage')),
			}

			if (paginator.total)
			{
				return paginator.total(count_queryset, response)
			}

			return response
		})
	}

	function update_queryset (queryset, user_id)
	{
		return Promise.all(
		[
			db.admin.is(user_id),
			db.investor.all.is(user_id)
		])
		.then(so =>
		{
			var is_admin = so[0]
			var is_investor = so[1]

			if (is_admin)
			{
				return true
			}

			queryset
			.innerJoin('investors', 'investors.user_id', 'feed_items.investor_id')

			if (is_investor)
			{
				queryset.where(function ()
				{
					/* all investor post and all public posts */
					this.where('investors.is_public', true)
					this.orWhere('feed_items.investor_id', user_id)
				})

				return true
			}

			if (! is_admin)
			{
				/* NET-1749 */
				queryset.whereNot(function ()
				{
					this.where('feed_items.type', 'trade')
					this.where(raw('feed_items.data'), '@>', { price: 0 })
					if (is_investor)
					{
						this.whereNot('feed_items.investor_id', user_id)
					}
				})
			}

			queryset.where('investors.is_public', true)

			return subscr.isAble(user_id, 'multiple_investors')
		})
	}

	function pick_feed_ids (feed_items)
	{
		return _.map(feed_items, 'id')
	}

	function pick_feed_investors (feed_items)
	{
		var ids
		ids = _.map(feed_items, 'investor_id')
		ids = _.uniq(ids)
		return ids
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

	feed.byIdRaw = function (id)
	{
		return feed.feed_table()
		.where(
		{
			id: id
		})
		.then(oneMaybe)
		.then(Err.nullish(NotFound))
	}

	feed.postByInvestor = function (trx, id, investor_id)
	{
		return feed.validateFeedId(id)
		.then(() =>
		{
			return investor.all.ensure(investor_id, trx)
		})
		.then(() =>
		{
			return feed.feed_table(trx)
			.where(
			{
				investor_id: investor_id,
				id: id
			})
		})
		.then(oneMaybe)
	}

	var AlreadyTraded = Err('holging_is_already_traded',
		'Holding is already traded')

	feed.ensureNotTraded =
		knexed.transact(knex, (trx, investor_id, symbol) =>
	{
		var symbol = _.pick(symbol, 'ticker', 'exchange')

		return feed.feed_table(trx)
		.where('investor_id', investor_id)
		.andWhere('type', 'trade')
		.andWhere(raw(`data->'symbol'`), '@>', symbol)
		.then(Err.emptish.not(() => AlreadyTraded({ symbol: symbol })))
	})

	function create (trx, investor_id, type, date, data)
	{
		return feed.feed_table(trx)
		.insert({
			investor_id: investor_id,
			type: type,
			timestamp: date,
			data: data
		}, ['id', 'investor_id'])
		.then(one)
	}

	// eslint-disable-next-line max-params
	function update (trx, investor_id, type, date, data, post_id)
	{
		return feed.feed_table(trx)
		.where('id', post_id)
		.update({
			timestamp: date,
			data: data
		}, ['id', 'investor_id'])
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

	// eslint-disable-next-line max-params
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
}


function transform_symbols (items, api)
{
	var symbols = Feed.symbolsInvolved(items)

	return api.resolveMany(symbols, { soft: true, other: true })
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

		if (data.chart && data.chart.symbol)
		{
			return data.chart.symbol
		}
	})

	symbols = flatten(symbols)
	symbols = compact(symbols)

	symbols = symbols.map(Symbl)

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
	if (data.chart && data.chart.symbol)
	{
		data.chart.symbol = pick(data.chart.symbol)
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
		return Symbl(item_s).toFull()
	}

	return symbol
})

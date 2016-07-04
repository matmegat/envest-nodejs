
var expect = require('chai').expect

var _ = require('lodash')

var knexed = require('../knexed')

var PaginatorChunked = require('../paginator/Chunked')
var PaginatorBooked  = require('../paginator/Booked')
var Filter = require('../Filter')

var Err = require('../../Err')
var NotFound = Err('feed_not_found', 'Feed item not found')
var WrongFeedId = Err('wrong_feed_id', 'Wrong feed id')

module.exports = function Feed (db)
{
	var feed = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe
	var count = db.helpers.count

	feed.feed_table = knexed(knex, 'feed_items')

	var paginators = {}

	paginators.chunked = PaginatorChunked(
	{
		table: feed.feed_table
	})

	paginators.booked = PaginatorBooked()

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
	})

	expect(db, 'Feed depends on Comments').property('comments')
	var comments = db.comments

	expect(db, 'Feed depends on Investor').property('investor')
	var investor = db.investor

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

				return feed_item
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

	feed.validateFeedId = require('../../id').validate.promise(WrongFeedId)

	feed.list = function (options)
	{
		options.paginator = _.extend({}, options.paginator,
		{
			order_column: 'feed_items.id'
		})

		var queryset = feed.feed_table()

		var paginator

		if (options.paginator.page)
		{
			paginator = paginators.booked
		}
		else
		{
			paginator = paginators.chunked
		}

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()

		queryset.select(
		'feed_items.id',
		'feed_items.timestamp',
		'feed_items.investor_id',
		'feed_items.type',
		'feed_items.data')

		return paginator.paginate(queryset, options.paginator)
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

				return feed_items
			})
		})
		.then((feed_items) =>
		{
			return investor.public.list(
			{
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
					investors: investors,
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

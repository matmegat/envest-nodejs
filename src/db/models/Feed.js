
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
	var feed_count = db.helpers.count

	feed.feed_table = knexed(knex, 'feed_items')

	var paginator_chunked = PaginatorChunked(
	{
		table: feed.feed_table
	})

	var filter = Filter()

	var WrongDaysFilter  = Err('wrong_days_filter', 'Wrong days filter')
	var WrongMonthFilter = Err('wrong_month_filter', 'Wrong month filter')
	var WrongInvestorId  = db.investor.WrongInvestorId

	filter.clauses =
	{
		type: filter.clausesByStr('type', '='),
		investor: filter.clausesById(WrongInvestorId, 'investor_id'),
		investors: filter.clausesByIds(WrongInvestorId, 'investor_id'),
		days: filter.clausesByDateSubtract(WrongDaysFilter, 'timestamp', 'days'),
		months: filter.clausesByDateSubtract(WrongMonthFilter, 'timestamp', 'months'),
		name: filter.clausesByName('feed_items.investor_id'),
		minyear: filter.clausesByYear('timestamp', '>='),
		maxyear: filter.clausesByYear('timestamp', '<=')
	}

	var paginator_booked = PaginatorBooked()

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
			return investor.byId(feed_item.investor_id)
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
		options = _.extend({}, options,
		{
			order_column: 'feed_items.id',
			real_order_column: 'feed_items.timestamp',
		})

		var queryset = feed.feed_table()

		var paginator
		if (options.page)
		{
			paginator = paginator_booked
		}
		else
		{
			paginator = paginator_chunked
		}

		queryset = filter.filtrate(queryset, options)

		var count_queryset = queryset.clone()

		return paginator.paginate(queryset, options)
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
			return investor.list(
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

				if (options.page)
				{
					return feed_count(count_queryset)
					.then((count) =>
					{
						return paginator.total(response, count)
					})
				}

				return response
			})
		})
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

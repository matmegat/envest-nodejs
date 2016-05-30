
var expect = require('chai').expect

var _ = require('lodash')

var Paginator = require('../Paginator')

var Err = require('../../Err')
var NotFound = Err('feed_not_found', 'Feed item not found')
var WrongFeedId = Err('wrong_feed_id', 'Wrong feed id')

var validateId = require('../../id').validate(WrongFeedId)

module.exports = function Feed (db)
{
	var feed = {}

	var knex = db.knex

	var oneMaybe = db.helpers.oneMaybe

	var paginator = Paginator()

	expect(db, 'Feed depends on Comments').property('comments')
	expect(db, 'Feed depends on Investor').property('investor')
	var comments = db.comments
	var investor = db.investor

	feed.NotFound = NotFound

	feed.feed_table = () => knex('feed_items')

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
				feed_item.investor = _.pick(investor, [ 'id', 'full_name', 'pic' ])
				delete feed_item.investor_id

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

	feed.validateFeedId = function (id)
	{
		return new Promise(rs =>
		{
			return rs(validateId(id))
		})
	}

	feed.list = function (options)
	{
		options = _.extend({}, options,
		{
			limit: 20
		})

		return paginator.paginate(feed.feed_table(), options)
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

				return response
			})
		})
	}

	return feed
}

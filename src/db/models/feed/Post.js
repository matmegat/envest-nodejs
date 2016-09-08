
var extend = require('lodash/extend')

var validate = require('../../validate')

var Err = require('../../../Err')

var moment = require('moment')

var Trade = require('./Trade')
var Watchlist = require('./Watchlist')
var Update = require('./Update')

module.exports = function Post (db)
{
	var post = {}

	post.types = {}
	post.types.trade = Trade(db.investor.portfolio, db.symbols, db.feed)
	post.types.watchlist = Watchlist(db)
	post.types.update = Update(db)

	var knex = db.knex

	var Emitter = db.notifications.Emitter

	var PostCreated = Emitter('post_created')
	var PostUpdated = Emitter('post_updated')
	var PostDeleted = Emitter('post_deleted')

	var WrongPostType = Err('wrong_feed_post_type', 'Wrong Feed Post Type')

	post.upsert = function (trx, investor_id, type, date, data, post_id)
	{
		return db.investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			if (! (type in post.types))
			{
				throw WrongPostType({ type: type })
			}

			var post_type = post.types[type]

			if (post_id)
			{
				return db.feed.postByInvestor(trx, post_id, investor_id)
				.then(Err.nullish(db.feed.NotFound))
				.then(prev_post =>
				{
					return post_type.update(trx, investor_id, type, date, data, post_id)
					.then(data =>
					{
						return extend({}, prev_post.data, data)
					})
				})
			}
			else
			{
				return post_type.set(trx, investor_id, type, date, data)
			}
		})
		.then(data =>
		{
			return db.feed.upsert(trx, investor_id, type, date, data, post_id)
		})
	}

	var InvestorPostDateErr =
		Err('investor_post_date_exeeded', 'Investor post date exeeded')

	post.update = function (investor_id, type, date, data, post_id)
	{
		validate_update_fields(post_id)

		return post.create(investor_id, type, date, data, post_id)
	}

	post.updateAs = function (whom_id, investor_id, type, date, data, post_id)
	{
		validate_update_fields(post_id)

		return post.createAs(whom_id, investor_id, type, date, data, post_id)
	}

	post.create = function (investor_id, type, date, data, post_id)
	{
		return knex.transaction(function (trx)
		{
			date = date || new Date()

			return Promise.resolve()
			.then(() =>
			{
				validate.date(date)

				var min_date = moment().subtract(3, 'days')

				if (! moment(date).isSameOrAfter(min_date))
				{
					throw InvestorPostDateErr({ date: date, minDate: min_date })
				}
			})
			.then(() =>
			{
				return post.upsert(trx, investor_id, type, date, data, post_id)
			})
			.then(post_id =>
			{
				PostCreated(investor_id,
				{
					investor: [ ':user-id', investor_id ],
					post_id: post_id
				})
			})
		})
	}

	post.createAs = function (whom_id, investor_id, type, date, data, post_id)
	{
		return knex.transaction(function (trx)
		{
			date = date || new Date()

			return Promise.resolve()
			.then(() =>
			{
				return validate.date(date)
			})
			.then(() =>
			{
				return post.upsert(trx, investor_id, type, date, data, post_id)
			})
			.then(created_post_id =>
			{
				if (post_id)
				{
					PostUpdated(investor_id,
					{
						admin: [ ':user-id', whom_id ],
						post_id: created_post_id
					})
				}
				else
				{
					PostCreated(investor_id,
					{
						admin: [ ':user-id', whom_id ],
						post_id: created_post_id
					})
				}
			})
		})
	}

	post.remove = function (investor_id, post_id, whom_id, soft_mode)
	{
		return knex.transaction(function (trx)
		{
			return db.feed.postByInvestor(trx, post_id, investor_id)
			.then(Err.nullish(db.feed.NotFound))
			.then(res =>
			{
				if (! soft_mode)
				{
					var post_type = post.types[res.type]

					return post_type.remove(trx, res)
				}
			})
			.then(() =>
			{
				return db.feed.remove(trx, investor_id, post_id)
			})
			.then(() =>
			{
				if (whom_id)
				{
					PostDeleted(investor_id,
					{
						admin: [ ':user-id', whom_id ],
						post_id: post_id
					})
				}
			})
		})
	}

	var PostIdRequired =
		Err('post_id_required', 'Post Id Required')

	function validate_update_fields (post_id)
	{
		if (! post_id)
		{
			throw PostIdRequired()
		}
	}

	return post
}


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

	var WrongPostType = Err('wrong_feed_post_type', 'Wrong Feed Post Type')

	post.add = function (trx, investor_id, type, date, data)
	{
		if (! (type in post.types))
		{
			throw WrongPostType({ type: type })
		}

		var post_type = post.types[type]

		return post_type.set(trx, investor_id, type, date, data)
	}

	var InvestorPostDateErr =
		Err('investor_post_date_exeeded', 'Investor post date exeeded')

	post.create = function (investor_id, type, date, data)
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
				return post.add(trx, investor_id, type, date, data)
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

	post.createAs = function (whom_id, investor_id, type, date, data)
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
				return post.add(trx, investor_id, type, date, data)
			})
			.then(post_id =>
			{
				PostCreated(investor_id,
				{
					admin: [ ':user-id', whom_id ],
					post_id: post_id
				})
			})
		})
	}

	return post
}


var validate = require('../../validate')

var Err = require('../../../Err')

var moment = require('moment')
var noop = require('lodash/noop')

var Trade = require('./Trade')
var Watchlist = require('./Watchlist')
var Update = require('./Update')

var Feed = require('./Feed')

module.exports = function Post (db)
{
	var post = {}

	post.feed_model = db.feed

	post.types = {}
	post.types.trade = Trade()
	post.types.watchlist = Watchlist(db.watchlist)
	post.types.update = Update()

	var knex = db.knex

	var Emitter = db.notifications.Emitter

	var PostCreated = Emitter('post_created')

	var WrongPostType = Err('wrong_feed_post_type', 'Wrong Feed Post Type')

	post.add = function (investor_id, type, date, data)
	{
		if (! (type in post.types))
		{
			throw WrongPostType({ type: type })
		}
		
		var post_type = post.types[type]

		return post_type.set(investor_id, type, date, data)
	}

	var InvestorPostDateErr =
		Err('investor_post_date_exeeded', 'Investor post date investor_post_date_exeeded')

	post.create = function (investor_id, type, date, data)
	{
		return knex.transaction(function (trx)
		{
			date = date || new Date()

			return Promise.resolve()
			.then(() =>
			{
				validate.date(date)

				var min_date = moment().day(-3)

				if (! moment(date).isSameOrAfter(min_date))
				{
					throw InvestorPostDateErr({date: date, minDate: min_date })
				}
			})
			.then(() =>
			{
				return post.feed_model.create(investor_id, type, date, data, trx)
			})
			.then(() =>
			{
				return post.add(investor_id, type, date, data)
			})
			.then(() =>
			{
				// PostCreated(investor_id, { by: 'investor', investor_id: investor_id })
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
				return post.feed_model.create(investor_id, type, date, data, trx)
			})
			.then(() =>
			{
				return post.add(investor_id, type, date, data)
			})
			.then(() =>
			{
				// PostCreated(investor_id, { by: 'admin', admin_id: whom_id })
			})
		})
	}

	return post
}

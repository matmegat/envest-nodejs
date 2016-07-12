
var validate = require('../../validate')

var Err = require('../../../Err')

var moment = require('moment')
var noop = require('lodash/noop')

var Trade = require('./Trade')
var Watchlist = require('./Watchlist')
var Update = require('./Update')

var Feed = require('./Feed')

module.exports = function Post (feed)
{
	var post = {}

	post.types = {}
	post.types.trade = Trade()
	post.types.watchlist = Watchlist()
	post.types.update = Update(feed)

	var WrongPostType = Err('wrong_feed_post_type', 'Wrong Feed Post Type')

	post.add = function (investor_id, type, date, data)
	{
		if (! type in post.types)
		{
			throw WrongPostType()
		}
		post = post.types[type]

		post.set(investor_id, type, date, data)
	}

	var InvestorPostDateErr =
		Err('investor_post_date_exeeded', 'Investor post date investor_post_date_exeeded')

	post.create = function (investor_id, type, date, data)
	{
		date = date || new Date()

		return Promise.resolve()
		.then(() =>
		{
			validate.date(date)

			var min_date = moment().day(-3)
			date = moment(date)

			if (! date.isSameOrAfter(min_date))
			{
				throw InvestorPostDateErr({date: date, minDate: min_date })
			}
		})
		.then(() =>
		{
			return post.add(investor_id, type, date, data)
		})
		.then(() =>
		{
			//Send notification
		})
		.then(noop)
	}

	post.createAs = function (admin_id, investor_id, type, date, data)
	{
		date = date || new Date()

		return Promise.resolve()
		.then(() =>
		{
			return validate.date(date)
		})
		.then(() =>
		{
			return post.add(investor_id, type, date, data)
		})
		.then(() =>
		{
			//Send notification
		})
		.then(noop)
	}

	return post
}

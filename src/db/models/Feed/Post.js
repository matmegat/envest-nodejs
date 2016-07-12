
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

	var InvestorPostDateErr =
		Err('investor_post_date_exeeded', 'Investor post date investor_post_date_exeeded')

	var WrongPostType = Err('wrong_feed_post_type', 'Wrong Feed Post Type')

	post.add = function (mode, investor_id, type, date, data)
	{
		date = date || new Date()

		return Promise.resolve()
		.then(() =>
		{
			validate.date(date)

			if (mode === "mode:post")
			{
				var min_date = moment().day(-3)
				date = moment(date)

				if (! date.isSameOrAfter(min_date))
				{
					throw InvestorPostDateErr({date: date, minDate: min_date })
				}
			}
		})
		.then(() =>
		{
			if (! type in post.types)
			{
				throw WrongPostType()
			}
		})
		.then(() =>
		{
			post = post.types[type]

			post.set(investor_id, type, date, data)
		})
		.then(noop)
	}

	return post
}

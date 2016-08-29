
var Type = require('./Type')

var pick = require('lodash/pick')
var assign = require('lodash/assign')

var validate = require('../../validate')

module.exports = function Trade (portfolio, symbols, feed)
{
	return Type(
	{
		validate: validate_trade,
		validate_update: validate_trade_adds,
		set: (trx, investor_id, type, date, data) =>
		{
			return symbols.resolve(data.symbol)
			.then(symbl =>
			{
				data.symbol = pick(symbl,
				[
					'ticker',
					'exchange'
				])
			})
			.then(() =>
			{
				return portfolio.makeTrade(trx, investor_id, type, date, data)
			})
			.then(() =>
			{
				return data
			})
		},
		update: (trx, investor_id, type, date, data, post_id) =>
		{
			return feed.postByInvestor(trx, post_id, investor_id)
			.then(item =>
			{
				return assign({}, item.data, data)
			})
		},
		remove: (trx, post) =>
		{
			// var reverted_dirs =
			// {
			// 	bought: 'sold',
			// 	sold: 'bought'
			// }

			// post.data.dir = reverted_dirs[post.data.dir]

			// return portfolio.makeTrade(
			// 	trx, post.investor_id, post.type, post.date, post.data)
			return
		}
	})
}

function validate_trade_adds (data)
{
	var data_update = pick(data,
	[
		'text',
		'risk',
		'motivations'
	])

	var data_restricted = pick(data,
	[
		'dir',
		'symbol',
		'price',
		'amount'
	])

	return new Promise(rs =>
	{
		validate.forbidden(data_restricted)

		validate.empty(data_update.text, 'text')

		validate.empty(data_update.risk, 'risk')

		data_update.motivations && validate.motivation(data_update.motivations)

		rs(data_update)
	})
}

function validate_trade (data)
{
	var data = pick(data,
	[
		'dir',
		'symbol',
		'price',
		'amount',
		'text',
		'risk',
		'motivations'
	])

	var trade_dirs = ['bought', 'sold']
	var validate_trade_dir = validate.collection(trade_dirs)

	return new Promise(rs =>
	{
		validate_trade_dir(data.dir)

		validate.required(data.text, 'text')
		validate.empty(data.text, 'text')

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.price, 'price')
		validate.empty(data.price, 'price')

		validate.required(data.amount, 'amount')
		validate.empty(data.amount, 'amount')

		validate.required(data.risk, 'risk')
		validate.empty(data.risk, 'risk')

		validate.required(data.motivations, 'motivations')
		validate.empty(data.motivations, 'motivations')
		validate.motivation(data.motivations)

		rs(data)
	})
}

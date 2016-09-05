
var Type = require('./Type')

var _ = require('lodash')

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
				data.symbol = _.pick(symbl,
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
				return _.assign({}, item.data, data)
			})
		},
		remove: (trx, post) =>
		{
			var reverted_dirs =
			{
				bought: 'sold',
				sold: 'bought'
			}

			post.data.dir = reverted_dirs[post.data.dir]
			post.data.is_delete = true

			return portfolio.makeTrade(
				trx, post.investor_id, post.type, post.timestamp, post.data)
		}
	})
}

var validate_risk = validate.collection([ 'low', 'medium', 'high' ])

function validate_trade_adds (data)
{
	var data_update = _.pick(data,
	[
		'text',
		'risk',
		'motivations'
	])

	var data_restricted = _.pick(data,
	[
		'dir',
		'symbol',
		'price',
		'amount'
	])

	data_update = _.omitBy(data_update, _.isNil)

	return new Promise(rs =>
	{
		validate.forbidden(data_restricted)

		if (data_update.text)
		{
			validate.empty(data_update.text, 'text')
			validate.string(data_update.text, 'text')
		}

		if (data_update.risk)
		{
			validate.empty(data_update.risk, 'risk')
			validate_risk(data_update.risk)
		}

		data_update.motivations && validate.motivation(data_update.motivations)

		rs(data_update)
	})
}

function validate_trade (data)
{
	var data = _.pick(data,
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
		validate.string(data.text, 'text')

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.price, 'price')
		validate.empty(data.price, 'price')

		validate.required(data.amount, 'amount')
		validate.empty(data.amount, 'amount')

		validate.required(data.risk, 'risk')
		validate.empty(data.risk, 'risk')
		validate_risk(data.risk)

		validate.required(data.motivations, 'motivations')
		validate.empty(data.motivations, 'motivations')
		validate.motivation(data.motivations)

		rs(data)
	})
}

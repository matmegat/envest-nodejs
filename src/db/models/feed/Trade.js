
var Type = require('./Type')

var pick = require('lodash/pick')
var assign = require('lodash/assign')

var validate = require('../../validate')

module.exports = function Trade (portfolio, symbols, feed)
{
	return Type(
	{
		validate: validate_trade,
		validate_update: validate_trade_additionals,
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
				return feed.upsert(trx, investor_id, type, date, data)
			})
		},
		update: (trx, investor_id, type, date, data, post_id) =>
		{
			return feed.byIdRaw(post_id)
			.then(item =>
			{
				data = assign(item.data, data)

				return feed.upsert(trx, investor_id, type, date, data, post_id)
			})
		},
		rollback: (post_id) =>
		{
			return feed.byId(post_id)
			.then(res =>
			{
				console.log(res)
			})
		}
	})
}

function validate_trade_additionals (data)
{
	var data = pick(data,
	[
		'text',
		'risk',
		'motivations'
	])

	return new Promise(rs =>
	{
		validate.empty(data.text, 'text')

		validate.empty(data.risk, 'risk')

		validate.empty(data.motivations, 'motivations')
		validate.motivation(data.motivations)

		rs(data)
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

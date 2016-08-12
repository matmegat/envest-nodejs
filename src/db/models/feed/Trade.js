
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Trade (portfolio, symbols, feed)
{
	return Type(
	{
		validate: validate_trade,
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
				return feed.create(trx, investor_id, type, date, data)
			})
		}
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
		validate.required(data.text, 'text')
		validate.empty(data.text, 'text')

		validate_trade_dir(data.dir)

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.price, 'price')
		validate.empty(data.price, 'price')

		validate.required(data.amount, 'amount')
		validate.empty(data.amount, 'amount')

		validate.required(data.risk, 'risk')
		validate.empty(data.risk, 'risk')

		validate.motivation(data.motivations)

		rs(data)
	})
}

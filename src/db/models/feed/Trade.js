
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Trade (portfolio)
{
	return Type(
	{
		validate: validate_trade,
		set: (trx, investor_id, type, date, data) =>
		{
			return portfolio.makeTrade(trx, investor_id, type, date, data)
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
	var validate_motivations_length = validate.length(3, 1)

	return new Promise(rs =>
	{
		validate.required(data.text, 'text')

		validate_trade_dir(data.dir)

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.price, 'price')
		validate.empty(data.price, 'price')

		validate.required(data.amount, 'amount')
		validate.empty(data.amount, 'amount')

		validate.required(data.risk, 'risk')
		validate.empty(data.risk, 'risk')

		validate.required(data.motivations, 'motivations')
		validate.array(data.motivations, 'motivations')
		validate_motivations_length(data.motivations, 'motivations')

		rs(data)
	})
}

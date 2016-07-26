
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')
var Err = require('../../../Err')

module.exports = function Trade (portfolio)
{
	return Type(
	{
		validate: validate_trade,
		set: (trx, investor_id, type, date, data) =>
		{
			return portfolio.updateBrokerage(trx, investor_id, type, date, data)
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

	var InvalidAmount = Err('invalid_value',
		'Invalid value for amount, price')

	return new Promise(rs =>
	{
		validate.required(data.text, 'text')

		validate_trade_dir(data.dir)

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.price, 'price')
		validate.empty(data.price, 'price')

		if (data.price <= 0)
		{
			throw InvalidAmount({field: 'price'})
		}

		validate.required(data.amount, 'amount')
		validate.empty(data.amount, 'amount')

		if (data.amount <= 0)
		{
			throw InvalidAmount({field: 'amount'})
		}

		validate.required(data.risk, 'risk')
		validate.empty(data.risk, 'risk')

		rs(data)
	})
}

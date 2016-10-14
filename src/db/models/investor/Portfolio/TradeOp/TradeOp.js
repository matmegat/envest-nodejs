
var assign = Object.assign

var expect = require('chai').expect
var wrap = require('lodash/wrap')

var Op = require('./Op')
var Symbl = require('../../../symbols/Symbl')

module.exports = function TradeOp (investor_id, timestamp, trade_data)
{
	var op = Op(investor_id, timestamp)

	expect(trade_data).an('object')

	expect(trade_data).property('dir')
	expect([ 'sold', 'bought' ]).include(trade_data.dir)

	expect(trade_data.price).a('number')
	expect(trade_data.amount).a('number')

	expect(trade_data.symbol).ok

	op.type = 'trade'

	op.trade_data = {}

	op.trade_data.dir = trade_data.dir
	op.trade_data.price = trade_data.price
	op.trade_data.amount = trade_data.amount
	op.trade_data.symbol = Symbl(trade_data.symbol)

	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type: op.type,
			trade_data: op.trade_data
		})
	})

	return op
}

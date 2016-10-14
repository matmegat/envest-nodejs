
var assign = Object.assign

var Op = require('./Op')

var wrap = require('lodash/wrap')

module.exports = function TradeOp (investor_id, timestamp, trade_data)
{
	var op = Op(investor_id, timestamp)

	op.type = 'trade'

	//
	op.trade_data = trade_data

	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type:  op.type,
			trade: op.trade_data
		})
	})

	return op
}

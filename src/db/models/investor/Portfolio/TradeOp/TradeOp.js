
var Op = require('./Op')

var TradeOp = function TradeOp (op, trade_data)
{
	op.trade_data = trade_data

	return op
}

TradeOp.prototype.toDb = () =>
{
	return {} // trade_data
}

TradeOp = Op(TradeOp)

module.exports = TradeOp

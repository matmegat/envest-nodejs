
var inst = (proto) => Object.create(proto)

var Op = require('./Op')

function TradeOp (op, trade_data)
{
	var op = inst(OpBase)

	// trade_data
	// op

	return op
}

TradeOp.prototype.toDb = () =>
{
	return {} // trade_data
}

TradeOp.prototype.apply = () => {}

TradeOp.prototype.modify = () => {}

TradeOp.prototype.undone = () => {}

TradeOp = Op(TradeOp)

module.exports = TradeOp


var ops =
{
	trade: require('./TradeOp'),
	nontrade: require('./NonTradeOp')
}

module.exports = function (type)
{
	if (type in ops)
	{
		return ops[type]
	}
	else
	{
		throw TypeError('unknown_op_type')
	}
}

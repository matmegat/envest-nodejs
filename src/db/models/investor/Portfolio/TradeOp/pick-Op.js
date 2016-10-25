
/* eslint-disable quote-props */
var ops =
{
	trade: require('./TradeOp'),
	nontrade: require('./NonTradeOp'),
	'init-brokerage': require('./InitBrokerageOp'),
	'init-holdings': require('./InitHoldingsOp'),
}
/* eslint-enable quote-props */

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

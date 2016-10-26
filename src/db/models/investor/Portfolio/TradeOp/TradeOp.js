
var assign = Object.assign

var wrap = require('lodash/wrap')

var Op = require('./Op')
var Symbl = require('../../../symbols/Symbl')

var validate = require('../../../../validate')

module.exports = function TradeOp (investor_id, timestamp, op_data)
{
	var op = Op(investor_id, timestamp)

	var trade_operations =
	[
		'sold',
		'bought'
	]
	var validate_dir = validate.collection(trade_operations)

	validate.object(op_data, 'TradeOp.op_data')
	validate.required(op_data.dir, 'TradeOp.op_data.dir')
	validate_dir(op_data.dir, 'TradeOp.op_data.dir')
	validate.number.nonNegative(op_data.price, 'TradeOp.op_data.price')
	validate.number.nonNegative(op_data.amount, 'TradeOp.op_data.amount')
	validate.required(op_data.symbol, 'TradeOp.op_data.symbol')

	op.type = 'trade'

	op.op_data = {}

	op.op_data.dir = op_data.dir
	op.op_data.price = op_data.price
	op.op_data.amount = op_data.amount
	op.op_data.symbol = Symbl(op_data.symbol)

	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type: op.type,
			data: op.op_data
		})
	})

	op.apply = (trx, portfolio) =>
	{
		return portfolio.makeTrade(
			trx, op.investor_id, op.type, op.timestamp.format(), op.op_data)
	}

	op.undone = (trx, portfolio) =>
	{
		return portfolio.removeTrade(trx, op)
	}

	op.resolve = (symbols) =>
	{
		return symbols.resolve(op.op_data.symbol, { other: true })
		.then(Symbl)
		.then(symbol =>
		{
			op.op_data.symbol = symbol
		})
	}

	op.equals = (other) =>
	{
		var dL = op.op_data
		var dR = other.op_data

		if (! Symbl.equals(dL.symbol, dR.symbol)) { return false }
		if (dL.dir !== dR.dir) { return false }

		return true
	}

	op.inspect = () =>
	{
		var td = op.op_data

		return `TRADEOP {${op.investor_id}} (${op.timestamp.format()})` +
		` ${td.dir} ${td.symbol.inspect()}` +
		` ${td.amount} shares per ${td.price}$`
	}

	return op
}

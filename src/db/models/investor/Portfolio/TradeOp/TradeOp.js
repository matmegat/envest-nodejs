
var assign = Object.assign

var expect = require('chai').expect
var wrap = require('lodash/wrap')

var Op = require('./Op')
var Symbl = require('../../../symbols/Symbl')

module.exports = function TradeOp (investor_id, timestamp, trade_data)
{
	var op = Op(investor_id, timestamp)

	// Remove expects due to trade validation?

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
			data: op.trade_data
		})
	})

	op.apply = (trx, portfolio) =>
	{
		return portfolio.makeTrade(
			trx, op.investor_id, op.type, op.timestamp.format(), op.trade_data)
	}

	op.undone = (trx, portfolio) =>
	{
		return portfolio.removeTrade(trx, op)
	}

	op.resolve = (symbols) =>
	{
		return symbols.resolve(op.trade_data.symbol, { other: true })
		.then(Symbl)
		.then(symbol =>
		{
			op.trade_data.symbol = symbol
		})
	}

	op.equals = (other) =>
	{
		var dL = op.trade_data
		var dR = other.trade_data

		if (! Symbl.equals(dL.symbol, dR.symbol)) { return false }
		if (dL.dir !== dR.dir) { return false }

		return true
	}

	op.inspect = () =>
	{
		var td = op.trade_data

		return `TRADEOP {${op.investor_id}} (${op.timestamp.format()})` +
		` ${td.dir} ${td.symbol.inspect()}` +
		` ${td.amount} shares per ${td.price}$`
	}

	return op
}

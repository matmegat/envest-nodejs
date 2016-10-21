
var assign = Object.assign

var expect   = require('chai').expect
var includes = require('lodash/includes')
var wrap     = require('lodash/wrap')

var Op       = require('./Op')
var validate = require('../../../../validate')

module.exports = function NonTradeOp (investor_id, timestamp, op_data)
{
	var non_trade_operations =
	[
		'deposit',
		'withdraw',
		'interest',
		'fee',
	]

	var recalculate_ops = [ 'deposit', 'withdraw', ]

	var op = Op(investor_id, timestamp)

	expect(op_data).to.be.an('object')

	expect(op_data).property('type')
	expect(non_trade_operations).include(op_data.type)

	validate.number.nonNegative(op_data.amount, 'amount')

	op.type = 'nontrade'

	op.op_data = {}
	op.op_data.type = op_data.type
	op.op_data.amount = op_data.amount

	op.toDb = wrap(op.toDb, (toDb) =>
	{
		return assign(toDb(),
		{
			type: op.type,
			data: op.op_data
		})
	})

	op.apply = (trx, db) =>
	{
		var is_recalc = includes(recalculate_ops, op.op_data.type)

		return db.portfolio.brokerage.byId(trx, op.investor_id, op.timestamp)
		.then(brokerage =>
		{
			var new_cash = brokerage.cash

			if (op.op_data.type === 'deposit' || op.op_data.type === 'interest')
			{
				new_cash += op.op_data.amount
			}
			if (op.op_data.type === 'withdraw' || op.op_data.type === 'fee')
			{
				new_cash -= op.op_data.amount
			}

			return db.portfolio.brokerage.put(
				trx,
				op.investor_id,
				new_cash,
				op.timestamp,
				null,
				{ recalculate: is_recalc }
			)
		})
	}

	op.undone = (trx, portfolio) =>
	{
		return portfolio.brokerage
		.remove(trx, op.investor_id, op.timestamp)
	}

	op.equals = (other) =>
	{
		return op.op_data.type === other.op_data.type
	}

	op.inspect = () =>
	{
		return `NONTRADE {${op.investor_id}} (${op.timestamp.format()})` +
		` ${op.op_data.type} ${op.op_data.amount}`
	}

	return op
}


var assign = Object.assign

var expect = require('chai').expect
var wrap   = require('lodash/wrap')

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

	var recalculate_ops = [ 'deposit', 'withdrawal', ]

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

	op.apply = (trx, portfolio) =>
	{
		var is_recalc = recalculate_ops.indexOf(op.op_data.type)

		/* Algo:
		* 1.1. Get Brokerage State
		* 1.2. Get Holdings State ????
		* 2. Calculate to state for amount
		* 3. Call setter with options
		* */

		return Promise.all(
		[
			portfolio.brokerage.byId(
				trx,
				op.investor_id,
				op.timestamp,
				{ soft: true }
			),
			portfolio.brokerage.isExist(trx, investor_id, timestamp)
		])
		.then(values =>
		{
			var brokerage = values[0]
			var is_exist = values[1]

			var new_cash = brokerage.cash

			if (is_exist)
			{
				if (op.op_data.type === 'fee' || op.op_data.type === 'withdraw')
				{
					new_cash -= op.op_data.amount
				}
				else
				{
					new_cash += op.op_data.amount
				}
			}
			else if (   op.op_data.type === 'deposit'
				     || op.op_data.type === 'interest')
			{
				new_cash = op.op_data.amount
			}

			return portfolio.brokerage.put(
				trx,
				op.investor_id,
				new_cash,
				timestamp,
				null,
				{ recalculate: is_recalc }
			)
		})
	}

	op.undone = (trx, portfolio) =>
	{
		return portfolio.brokerage.table(trx)
		.where(op.toPK())
		.where('timestamp', op.timestamp)
		.delete()
	}

	op.equals = (other) =>
	{
		return op.op_data.type === other.op_data.type
	}

	return op
}


var assign = Object.assign

var expect = require('chai').expect
var wrap   = require('lodash/wrap')

var Op = require('./Op')

module.exports = function NonTradeOp (investor_id, timestamp, op_data)
{
	var non_trade_operations =
	[
		'deposit',
		'withdrawal',
		'interest',
		'fee',

		'init',
	]

	var op = Op(investor_id, timestamp)

	expect(op_data).to.be.an('object')

	expect(op_data).property('type')
	expect(non_trade_operations).include(op_data.type)

	expect(op_data.amount).to.be.a('number')

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
		// TODO
		return Promise.resolve()
	}

	op.undone = (trx, portfolio) =>
	{
		// TODO
		return Promise.resolve()
	}

	return op
}

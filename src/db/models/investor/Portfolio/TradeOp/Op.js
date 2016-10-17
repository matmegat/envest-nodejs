
var expect = require('chai').expect

var inst = () => Object.create(Op.prototype)

var Op = module.exports = function Op (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(timestamp).a('date')

	var op = inst()

	op.investor_id = investor_id
	op.timestamp = timestamp

	op.toDb = () =>
	{
		return op.toPK()
	}

	op.toPK = () =>
	{
		return {
			investor_id: op.investor_id,
			timestamp:   op.timestamp
		}
	}

	op.apply = (trx, portfolio) =>
	{
		return Promise.resolve()
	}

	op.undone = (trx, portfolio) =>
	{
		return Promise.resolve()
	}

	return op
}

Op.prototype.tradeop = true

Op.is = (op) =>
{
	return Boolean(op.tradeop)
}

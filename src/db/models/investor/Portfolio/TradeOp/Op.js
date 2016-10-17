
var expect = require('chai').expect

var inst = () => Object.create(Op.prototype)

var Op = module.exports = function Op (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(timestamp).a('date')

	timestamp.setMilliseconds(0)

	var op = inst()

	op.investor_id = investor_id
	op.timestamp = timestamp
	op.type = NaN

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

	op.equals = (/* other */) =>
	{
		return false
	}

	return op
}

Op.prototype.tradeop = true

Op.is = (op) =>
{
	return Boolean(op.tradeop)
}

Op.equals = (L, R) =>
{
	expect(Op.is(L)).true
	expect(Op.is(R)).true

	if (L.type !== R.type) { return false }
	if (L.investor_id !== R.investor_id) { return false }
	if (L.timestamp !== R.timestamp) { return false }

	return L.equals(R)
}

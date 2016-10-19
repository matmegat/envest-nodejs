
var expect = require('chai').expect

var moment = require('moment')

var inst = () => Object.create(Op.prototype)

var Op = module.exports = function Op (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(moment.isDate(timestamp) || moment.isMoment(timestamp)).true

	timestamp = moment(timestamp)
	timestamp.milliseconds(0)

	var op = inst()

	op.investor_id = investor_id
	op.timestamp = moment(timestamp)
	op.type = NaN

	op.toDb = () =>
	{
		return op.toPK()
	}

	op.toPK = () =>
	{
		return {
			investor_id: op.investor_id,
			timestamp:   op.timestamp.format()
		}
	}

	// eslint-disable-next-line no-unused-vars
	op.apply = (trx, portfolio) =>
	{
		return Promise.resolve()
	}

	// eslint-disable-next-line no-unused-vars
	op.undone = (trx, portfolio) =>
	{
		return Promise.resolve()
	}

	// eslint-disable-next-line no-unused-vars
	op.equals = (other) =>
	{
		return false
	}

	op.inspect = () =>
	{
		return `OP {${op.investor_id}} (${op.timestamp.format()})`
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
	if (L.timestamp.toISOString() !== R.timestamp.toISOString()) { return false }

	return L.equals(R)
}

Op.sameTime = (L, R) =>
{
	expect(Op.is(L)).true
	expect(Op.is(R)).true

	return L.timestamp.toISOString() === R.timestamp.toISOString()
}

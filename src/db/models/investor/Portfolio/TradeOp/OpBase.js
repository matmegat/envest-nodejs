
var expect = require('chai').expect

var create = Object.create
var inst = (C) => create(C.prototype)

var OpBase = module.exports = function OpBase (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(timestamp).a('date')

	var op = inst(Op)

	op.investor_id = investor_id
	op.timestamp = timestamp

	return op
}

ObBase.prototype.toDb = () =>
{
	return {
		investor_id: investor_id,
		timestamp: timestamp
	}
}

ObBase.apply = () => {}

ObBase.modify = () => {}

ObBase.undone = () => {}


var expect = require('chai').expect

var create = Object.create
var inst = (C) => create(C.prototype)

var OpBase = module.exports = function OpBase (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(timestamp).a('date')

	var op = inst(OpBase)

	op.investor_id = investor_id
	op.timestamp = timestamp

	return op
}

OpBase.prototype.toDb = () =>
{
	return {
		investor_id: this.investor_id,
		timestamp:   this.timestamp
	}
}

OpBase.prototype.equals = (op) =>
{
	return (op.investor_id === this.investor_id)
	    && (op.timestamp   === this.timestamp)
}

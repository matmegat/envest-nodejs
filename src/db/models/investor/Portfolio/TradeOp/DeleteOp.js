
var expect = require('chai').expect

var Op = require('./Op')

module.exports = function DeleteOp (_, _, other_op)
{
	expect(Op.is(other_op)).true

	var op = Op(other_op.investor_id, other_op.timestamp)

	op.type = 'delete'
	op.other_op = other_op

	op.toDb = () =>
	{
		throw new TypeError('delete_op_cannot_be_stored')
	}

	return op
}

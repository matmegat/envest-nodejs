
var expect = require('chai').expect

module.exports = function Op (investor_id, timestamp)
{
	expect(investor_id).a('number')
	expect(timestamp).a('date')

	var op = {}

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

	return op
}

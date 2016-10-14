
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
		return {
			investor_id: this.investor_id,
			timestamp:   this.timestamp
		}
	}

	return op
}

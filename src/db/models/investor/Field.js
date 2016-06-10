
module.exports = function Field (options)
{
	options = extend({}, options)

	expect(options.set, '`set` is required').ok

	var field = {}

	field.validate = validator(options.validate)

	return field
}

var extend = require('lodash/extend')
var expect = require('chai').expect


var same   = require('lodash/identity')

function validator (validate)
{
	if (typeof validate !== 'function')
	{
		validate = same
	}

	return (value) =>
	{
		return new Promise(rs => rs(validate(value)))
	}
}

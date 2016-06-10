
module.exports = function Field (options)
{
	options = extend({}, options)

	var field = {}

	field.validate = validator(options.validate)

	field.set = setter(field, options.set)
	field.get = getter(field, options.get)

	return field
}

var extend = require('lodash/extend')


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


var expect = require('chai').expect

function setter (field, set)
{
	expect(set).a('function')

	return (value, queryset) =>
	{
		return field.validate(value)
		.then(value =>
		{
			/* to capture validator not returning */
			expect(value).ok

			return set(value, queryset)
		})
	}
}

function getter (field, get)
{
	expect(get).a('function')

	return (queryset) =>
	{
		return get(queryset)
	}
}

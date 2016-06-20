
module.exports = function Field (investor, options)
{
	options = extend({}, options)

	var field = {}

	field.investor = investor
	field.validate = validator(options.validate)

	field.set = setter(field, options.set)
	// field.get = getter(field, options.get)

	return field
}

var extend = require('lodash/extend')


var same = require('lodash/identity')

function validator (validate)
{
	if (typeof validate !== 'function')
	{
		validate = same
	}

	return (value) =>
	{
		return new Promise(rs => rs(validate(value)))
		.then(value =>
		{
			/* to capture validator not returning */
			expect(value).ok

			return value
		})
	}
}


var expect = require('chai').expect
var noop = require('lodash/noop')

function setter (field, set)
{
	expect(set).a('function')

	return (investor_id, value) =>
	{
		return field.investor.all.ensure(investor_id)
		.then(() =>
		{
			return field.validate(value)
		})
		.then(value =>
		{
			var queryset = field.investor.table()
			.where('user_id', investor_id)

			return set(value, queryset)
		})
		.then(noop)
	}
}

/*
function getter (field, get)
{
	expect(get).a('function')

	return (queryset) =>
	{
		return get(queryset)
	}
}
*/

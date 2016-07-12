
module.exports = function Field (investor, options)
{
	options = extend({}, options)

	var field = {}

	field.investor = investor
	field.validate = validator(options.validate)

	field.set = setter(field, options.set)

	field.verify = verifier(field, options.verify)

	field.key = options.key

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
			expect(value).to.be.not.null
			expect(value).to.be.not.undefined
			/* it will allow to return 0 */

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

			return set(value, queryset, investor_id)
		})
		.then(noop)
	}
}

var one = require('../../helpers').one

function verifier (field, verify)
{
	if (typeof verify !== 'function')
	{
		verify = (value) => value != null /* || undefined */
	}

	return (investor_id) =>
	{
		if (! field.key)
		{
			return verify(null, investor_id)
		}

		return field.investor.table()
		.where('user_id', investor_id)
		.then(one)
		.then((entry) =>
		{
			return field.validate(entry[field.key])
			.then((value) =>
			{
				return verify(value, investor_id)
			})
		})
	}
}

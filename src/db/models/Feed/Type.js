
var extend = require('lodash/extend')
var same = require('lodash/identity')
var noop = require('lodash/noop')

module.exports = function Type (options)
{
	options = extend({}, options)

	var type = {}

	type.validate = validator(options.validate)
	type.set = setter(type, options.set)

	return type
}

function validator (func)
{
	return (data) =>
	{
		return new Promise(rs => rs(func(data)))
	}
}

function setter (type, set)
{
	return (trx, investor_id, feed_type, date, data) =>
	{
		return type.validate(data)
		.then(data =>
		{
			return set(trx, investor_id, feed_type, date, data)
		})
		.then(noop)
	}
}

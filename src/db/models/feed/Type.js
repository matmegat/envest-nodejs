
var extend = require('lodash/extend')

module.exports = function Type (options)
{
	options = extend({}, options)

	var type = {}

	type.validate = validator(options.validate)
	type.validate_update = validator_update(options.validate_update)
	type.set = setter(type, options.set)
	type.update = updater(type, options.update)

	return type
}

function validator (func)
{
	return (data) =>
	{
		return new Promise(rs => rs(func(data)))
	}
}

function validator_update (func)
{
	return (data) =>
	{
		return new Promise(rs => rs(func(data)))
	}
}

function setter (type, set)
{
	return (trx, investor_id, feed_type, date, data, post_id) =>
	{
		return type.validate(data)
		.then(data =>
		{
			return set(trx, investor_id, feed_type, date, data, post_id)
		})
	}
}

function updater (type, update)
{
	return (trx, investor_id, feed_type, date, data, post_id) =>
	{
		return type.validate_update(data)
		.then(data =>
		{
			return update(trx, investor_id, feed_type, date, data, post_id)
		})
	}
}

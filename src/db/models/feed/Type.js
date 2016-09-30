
var extend = require('lodash/extend')

module.exports = function Type (options)
{
	options = extend({}, options)

	var type = {}

	type.validate = validator(options.validate)
	type.validate_update = validator(options.validate_update)
	type.set = setter(type, options.set)
	type.update = updater(type, options.update)
	type.remove = remover(options.remove)

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
	return (trx, investor_id, feed_type, date, data, prev_data) =>
	{
		return type.validate_update(data, prev_data)
		.then(data =>
		{
			return update(trx, investor_id, feed_type, date, data, prev_data)
		})
	}
}

function remover (remove)
{
	return (trx, post) =>
	{
		return remove(trx, post)
	}
}

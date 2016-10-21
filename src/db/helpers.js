
var helpers = module.exports = {}

helpers.exists = function exists (queryset)
{
	ensureNotMultiple(queryset)

	return queryset.length === 1
}

helpers.oneMaybe = function oneMaybe (queryset)
{
	ensureNotMultiple(queryset)

	return queryset[0]
}

helpers.one = function one (queryset)
{
	ensureNotMultiple(queryset)

	if (queryset.length === 0)
	{
		throw new Error('query must return strict 1 entry')
	}

	return queryset[0]
}

helpers.count = function count (queryset)
{
	return queryset
	.count()
	.then(helpers.one)
	.then(row => row.count)
	.then(Number)
}

function ensureNotMultiple (queryset)
{
	if (! Array.isArray(queryset))
	{
		throw new Error('queryset must be an array')
	}

	if (queryset.length > 1)
	{
		throw new Error('query cannot return more that 1 entry')
	}
}


var Keyspace = helpers.Keyspace = require('./Keyspace')


var assign = Object.assign
var dump = JSON.stringify
var load = JSON.parse

helpers.cached = function (redis, prefix, options, key_fn, fn)
{
	options = assign(
	{
		ttl: 60
	}
	, options)

	var keyspace = Keyspace(prefix)

	return function ()
	{
		var key = key_fn.apply(this, arguments)

		var key_str = keyspace(key)

		return redis.get(key_str)
		.then(value =>
		{
			console.log(value)
			if (value != null)
			{
				console.warn('get', key_str)
				return load(value)
			}
			else
			{
				console.log(1)
				return fn.apply(this, arguments)
				.then(value =>
				{
					console.info('put', key_str)
					redis.set(key_str, dump(value), 'EX', options.ttl)

					return value
				})
			}
		})
	}
}


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

helpers.Cache = function (redis)
{
	var cache = {}

	cache.regular = function (prefix, options, key_fn, fn)
	{
		var keyspace = Keyspace(prefix)

		options = assign(
		{
			ttl: 60
		}
		, options)

		return function ()
		{
			var key = key_fn.apply(this, arguments)

			var key_str = keyspace(key)

			return redis.get(key_str)
			.then(value =>
			{
				if (value != null)
				{
					return load(value)
				}
				else
				{
					return fn.apply(this, arguments)
					.then(value =>
					{
						redis_set(redis, key_str, value, options)

						return value
					})
				}
			})
		}
	}

	cache.slip = function (prefix, options, key_fn, fn)
	{
		var keyspace = Keyspace(prefix)

		options = assign(
		{
			ttl: Infinity,
			def_fn: () => []
		}
		, options)

		return function ()
		{
			var key = key_fn.apply(this, arguments)

			var key_str = keyspace(key)

			return redis.get(key_str)
			.then(value =>
			{
				if (value != null)
				{
					return load(value)
				}
				else
				{
					console.warn('default')
					return options.def_fn.apply(this, arguments)
				}
			})
			.then(value =>
			{
				setImmediate(() =>
				{
					fn.apply(this, arguments)
					.then(value =>
					{
						redis_set(redis, key_str, value, options)

						console.info(value.length)

						return value
					})
				})

				return value
			})
		}
	}

	function redis_set (redis, key_str, value, options)
	{
		var args = [ key_str, dump(value) ]

		if (options.ttl < Infinity)
		{
			args.push('EX', options.ttl)
		}

		return redis.set.apply(redis, args)
	}

	return cache
}


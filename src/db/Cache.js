
var Keyspace = require('./Keyspace')

var assign = Object.assign
var dump = JSON.stringify
var load = JSON.parse

module.exports = function (redis)
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
						setImmediate(() =>
						{
							redis_set(key_str, value, options)
						})

						return value
					})
				}
			})
		}
	}

	cache.slip = function (prefix, options, key_fn, fn)
	{
		var keyspace = Keyspace(prefix)
		var actualize = actualizer(options, fn)

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
					return options.def_fn.apply(this, arguments)
				}
			})
			.then(value =>
			{
				actualize(this, arguments, key_str)

				return value
			})
		}
	}


	function actualizer (options, fn)
	{
		return (context, args, key_str) =>
		{
			setImmediate(() =>
			{
				fn.apply(context, args)
				.then(value =>
				{
					redis_set(key_str, value, options)
				})
			})
		}
	}


	function redis_set (key_str, value, options)
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

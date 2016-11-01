
var Keyspace = require('./Keyspace')

var assign = Object.assign
var dump = JSON.stringify
var load = JSON.parse

module.exports = function (redis, cache_options)
{
	var cache = {}

	cache_options = assign(
	{
		debug: false
	}
	, cache_options)

	cache.regular = function (prefix, options, key_fn, fn)
	{
		var keyspace = Keyspace(prefix)

		options = assign(
		{
			ttl: 60,
			actualize: true
		}
		, options)

		if (options.actualize)
		{
			var actualize = actualizer(options, fn)
		}

		return function ()
		{
			var key = key_fn.apply(this, arguments)

			var key_str = keyspace(key)

			return redis.get(key_str)
			.then(value =>
			{
				if (value != null)
				{
					debug_hit(key_str)

					if (options.actualize)
					{
						actualize(this, arguments, key_str)
					}

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
					debug_hit(key_str)

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

		debug_put(key_str)

		return redis.set.apply(redis, args)
	}


	function debug_put (key_str)
	{
		process.nextTick(() =>
		{
			if (cache_options.debug)
			{
				// console.info('PUT cache %s `%s`', symbol, data.company)
				console.info('PUT cache %s', key_str)
			}
		})
	}

	function debug_hit (key_str)
	{
		process.nextTick(() =>
		{
			if (cache_options.debug)
			{
				// console.info('HIT cache %s `%s`', symbol, data.company)
				console.info('HIT cache %s', key_str)
			}
		})
	}

	return cache
}

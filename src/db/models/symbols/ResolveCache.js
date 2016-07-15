
var Symbl = require('./Symbl')

module.exports = function ResolveCache ()
{
	var cache = {}

	var model = {}

	model.put = (symbol, data) =>
	{
		var key = resolve_key(symbol)

		cache[key] = data

		console.info('cache put', key, data)
	}

	model.in = (symbol) =>
	{
		var key = resolve_key(symbol)

		return Boolean(key in cache)
	}

	model.get = (symbol) =>
	{
		var key = resolve_key(symbol)

		var data = cache[key]

		if (data !== undefined)
		{
			console.info('cache hit', key, data)
		}

		return data
	}


	function resolve_key (symbol)
	{
		return Symbl(symbol).toXign()
	}


	return model
}

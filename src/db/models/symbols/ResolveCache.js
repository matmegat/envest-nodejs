
var Symbl = require('./Symbl')

module.exports = function ResolveCache ()
{
	var cache = {}

	var model = {}

	model.put = (symbol, data) =>
	{
		var key = resolve_key(symbol)

		cache[key] = data

		console.warn('cache put', key, data)
	}

	model.in = (symbol) =>
	{
		var key = resolve_key(symbol)

		return Boolean(key in cache)
	}

	model.get = (symbol) =>
	{
		var key = resolve_key(symbol)

		console.warn('cache get', key, cache[key])

		return cache[key]
	}


	function resolve_key (symbol)
	{
		return Symbl(symbol).toXign()
	}


	return model
}

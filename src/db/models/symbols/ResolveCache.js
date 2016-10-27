
var Symbl = require('./Symbl')

module.exports = function ResolveCache ()
{
	var cache = {}

	var model = {}

	model.put = (symbol, data) =>
	{
		symbol = Symbl(symbol)

		var key = resolve_key(symbol)

		cache[key] = data

		console.info('PUT cache %s `%s`', symbol, data.company)
	}

	model.in = (symbol) =>
	{
		var key = resolve_key(symbol)

		return Boolean(key in cache)
	}

	model.get = (symbol) =>
	{
		symbol = Symbl(symbol)

		var key = resolve_key(symbol)

		var data = cache[key]

		if (data !== void 0)
		{
			console.info('HIT cache %s `%s`', symbol, data.company)
		}

		return data
	}


	function resolve_key (symbol)
	{
		return Symbl(symbol).toXign()
	}


	return model
}


var slice = require('lodash/slice')
var flatten = require('lodash/flatten')

module.exports = function Keyspace (prefix)
{
	prefix = slice(arguments)
	prefix = flatten(prefix)

	var keyspace = function keyspace (key)
	{
		key = slice(arguments)
		key = flatten(key)

		key = [].concat(prefix, key)

		var key_str = key.join('|')

		return key_str
	}

	keyspace.derive = (add_prefix) =>
	{
		add_prefix = slice(add_prefix)

		return Keyspace([].concat(prefix, add_prefix))
	}

	return keyspace
}

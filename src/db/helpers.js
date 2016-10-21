
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


helpers.Keyspace = require('./Keyspace')

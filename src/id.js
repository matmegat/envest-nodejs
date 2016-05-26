
var _ = require('lodash')

var toNumber  = _.toNumber
var isInteger = _.isInteger

var id = module.exports = {}

var toId = id.toId = function toId (id)
{
	id = toNumber(id)

	if (isInteger(id) && id > 0)
	{
		return id
	}

	return null
}

id.validate = function (id, fn)
{
	id = toId(id)

	if (! id)
	{
		throw fn()
	}

	return id
}
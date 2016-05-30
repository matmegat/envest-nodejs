
var _ = require('lodash')

var id = module.exports = {}


var toNumber  = _.toNumber
var isInteger = _.isInteger

var toId = id.toId = function toId (id)
{
	id = toNumber(id)

	if (isInteger(id) && id > 0)
	{
		return id
	}

	return null
}


var curry = _.curry

id.validate = curry((fn, id) =>
{
	id = toId(id)

	if (! id)
	{
		throw fn()
	}

	return id
})

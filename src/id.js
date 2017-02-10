
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

var validate = id.validate = curry((fn, id) =>
{
	id = toId(id)

	if (! id)
	{
		throw fn()
	}

	return id
})

id.validateMany = curry((fn, ids) =>
{
	ids.forEach(validate(fn))
})

id.validate.promise = curry((fn, id) =>
{
	return new Promise(rs => rs(validate(fn, id)))
})

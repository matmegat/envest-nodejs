
var _ = require('lodash')

var toNumber  = _.toNumber
var isInteger = _.isInteger

module.exports = function toId (id)
{
	var id = toNumber(id)

	if (isInteger(id) && id > 0)
	{
		return id
	}
}

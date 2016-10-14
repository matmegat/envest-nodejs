
var assign = Object.assign

var slice = require('lodash/slice')

var OpBase = require('./OpBase')

module.exports = function Op (C)
{
	C.prototype.toDb = $toDb(C.prototype.toDb)

	return function (investor_id, timestamp)
	{
		var aux = slice(arguments, 2)

		var op = OpBase(investor_id, timestamp)

		op = C.apply(null, [ op ].concat(aux))

		op.toDb = op.toDb.bind(op)

		return op
	}
}

function $toDb (toDb)
{
	return function ()
	{
		var base = OpBase.prototype.toDb.call(this)
		var aux  = toDb.call(this)

		return assign({}, base, aux)
	}
}

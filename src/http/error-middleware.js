
var toss = require('./toss')
var Err = require('../Err')

var MiddlewareError = Err('Middleware_error', 'Middleware error')

// eslint-disable-next-line no-unused-vars
module.exports = (err, rq, rs, next) =>
{
	if (Err.is(err))
	{
		return toss.err(rs, err)
	}
	else
	{
		console.error(err)

		return toss.err(rs, MiddlewareError())
	}
}

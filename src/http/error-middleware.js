
var toss = require('./toss')
var Err = require('../Err')

var MiddlewareError = Err('middleware_error', 'Middleware error')

// eslint-disable-next-line no-unused-vars, max-params
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

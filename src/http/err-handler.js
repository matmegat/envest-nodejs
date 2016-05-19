
var toss = require('./toss')
var Err = require('../Err')

var MiddlewareError = Err('middleware_error', 'Middleware error')

module.exports = (err, rq, rs, next) =>
{
	if (Err.is(err))
	{
		return toss.err(rs, err)
	}
	else
	{
		if (err.oauthError)
		{
			err.oauth_error = JSON.parse(err.oauthError.data)

			return toss.err(rs, MiddlewareError(err.oauth_error))
		}
		else
		{
			return toss.err(rs, MiddlewareError())
		}
	}
}

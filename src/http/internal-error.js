
var toss = require('./toss')
var Err = require('../Err')

var InternalError = Err('internal_error', 'Internal error')

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
		console.error(err.stack)

		return toss.err(rs, InternalError())
	}
}

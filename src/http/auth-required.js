
var Err = require('../Err')
var AuthRequired = Err('auth_required', 'Auth required for this operation')

var toss = require('./toss')

module.exports = function (rq, rs, next)
{
	if (rq.isAuthenticated())
	{
		next()
	}
	else
	{
		toss.err(rs, AuthRequired())
	}
}

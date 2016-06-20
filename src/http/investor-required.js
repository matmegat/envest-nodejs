
var toss = require('./toss')

module.exports = function (investor)
{
	return (rq, rs, next) =>
	{
		return investor.ensure(rq.user.id)
		.then(() => next(), toss.err(rs))
	}
}


var toss = require('./toss')

module.exports = function (admin)
{
	return (rq, rs, next) =>
	{
		return admin.ensure(rq.user.id)
		.then(() => next(), toss.err(rs))
	}
}

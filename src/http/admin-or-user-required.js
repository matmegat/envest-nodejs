
var toss = require('./toss')
var Err = require('../Err')
var AccessRequired = Err(
	'access_required'
)

module.exports = function (model, admin)
{
	/*
	* Model should expect to be User or Investor
	* */

	return (rq, rs, next) =>
	{
		return Promise.all(
		[
			model.is(rq.user.id),
			admin.is(rq.user.id)
		])
		.then((so) =>
		{
			var is_same = so[0]
			var is_admin = so[1]

			if (is_admin || is_same)
			{
				return next()
			}

			toss.err(rs, AccessRequired())
		})
	}
}

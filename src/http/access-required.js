
var toss = require('./toss')
var Err = require('../Err')
var AccessRequired = Err(
	'access_required',
	'To access this you should be owner or admin'
)

module.exports = function (model, admin)
{
	/*
	* Model should expect to be User or Investor
	* */

	return (rq, rs, next) =>
	{
		var destination_id = Number(rq.params.id)

		return Promise.all(
		[
			model.is(rq.user.id),
			admin.is(rq.user.id)
		])
		.then((so) =>
		{
			var is_same = so[0]
			var is_admin = so[1]

			if (is_admin)
			{
				return next()
			}
			else if (is_same && rq.user.id === destination_id)
			{
				return next()
			}

			toss.err(rs, AccessRequired())
		})
	}
}

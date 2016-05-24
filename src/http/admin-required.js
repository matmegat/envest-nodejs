
var Err = require('../Err')
var AdminRequired =
    Err('admin_required', 'Admin privileges is required for this operation')

var toss = require('./toss')

module.exports = function (admin)
{
	return (rq, rs, next) =>
	{
		/*
		 * if admin.is() throws by any reason we cast it to `false`
		 * any `false` by any mean leads to AdminRequired error
		 *
		 * so we guarantee that admin-required is OK ONLY if
		 * admin.is() is `true`
		 */

		return admin.is(rq.user.id)

		// if any error occurs, cast them to false
		.catch(debug)

		// capture all falsy values
		.then(Err.falsy(AdminRequired))

		//    OK            ERR
		.then(() => next(), toss.err(rs))
	}
}

function debug (error)
{
	console.error('admin-required error')
	console.error(error)

	return false
}

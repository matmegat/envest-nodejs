
var expect = require('chai').expect

module.exports = function (db)
{
	var statistics = {}

	expect(db, 'Auth depends on User').property('user')
	var user = db.user

	statistics.subscriptions = () =>
	{
		return user.countBySubscriptions()
	}

	statistics.users_confirmed = () =>
	{
		return user.countByEmailConfirms()
	}

	return statistics
}

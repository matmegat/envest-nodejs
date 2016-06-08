
module.exports = function Groups (db, user)
{
	var groups = {}

	var knex = db.knex

	var oneMaybe = db.helpers.oneMaybe

	groups.byId = function (user_id)
	{
		return user.users_table()
		.select(
			'users.id',
			knex.raw(
				`CASE
					WHEN admins.user_id IS NOT NULL
						THEN 'admins'
					WHEN investors.user_id IS NOT NULL
						 THEN 'investors'
					ELSE 'users'
				END AS group`
			)
		)
		.leftJoin(
			'admins',
			'users.id',
			'admins.user_id'
		 )
		.leftJoin(
			'investors',
			'users.id',
			'investors.user_id'
		)
		.where('users.id', user_id)
		.then(oneMaybe)
	}

	groups.isAdmin    = group_is('admins')
	groups.isInvestor = group_is('investors')
	groups.isUser     = group_is('users')

	function group_is (str)
	{
		return (group) =>
		{
			return group === str
		}
	}

	return groups
}

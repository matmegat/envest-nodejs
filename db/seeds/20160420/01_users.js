
exports.seed = function (knex, Promise)
{
	return Promise.join(
		// Deletes ALL existing entries
		knex('users').del(),

		// Inserts seed entries
		knex('users').insert(
			{
				id: 1,
				email: 'seed.1@user.com',
				full_name: 'Seed User1',
				password: '6af505f9fc1b1835f8e712edcb8f0370dbf2',	// 321321
				salt: 'c27627b477f367e6'
			}
		),
		knex('users').insert(
			{
				id: 2,
				email: 'seed.2@user.com',
				full_name: 'Seed User2',
				password: '6af505f9fc1b1835f8e712edcb8f0370dbf2',	// 321321
				salt: 'c27627b477f367e6'
			}
		),
		knex('users').insert(
			{
				id: 3,
				email: 'seed.3@user.com',
				full_name: 'Seed User3',
				password: '6af505f9fc1b1835f8e712edcb8f0370dbf2',	// 321321
				salt: 'c27627b477f367e6'
			}
		)
	)
}

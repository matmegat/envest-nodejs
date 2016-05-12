/* eslint-disable max-len */

exports.seed = function (knex, Promise)
{
	return Promise.join(
		// Deletes ALL existing entries
		knex('users').del(),

		// Inserts seed entries
		knex('users')
		.insert(
		{
			email: 'seed.1@user.com',
			full_name: 'Seed User1',
			password: '13e3b57d2130ef454db3e9a8645da7eb9b67e3c1ec472cd10c27106ca582cac619e7efb0', // 321321
			salt: '9eae2ad71fc1dd2a071e4284aded85c4'
		}),
		knex('users')
		.insert(
		{
			email: 'seed.2@user.com',
			full_name: 'Seed User2',
			password: '13e3b57d2130ef454db3e9a8645da7eb9b67e3c1ec472cd10c27106ca582cac619e7efb0', // 321321
			salt: '9eae2ad71fc1dd2a071e4284aded85c4'
		}),
		knex('users').insert(
		{
			email: 'seed.3@user.com',
			full_name: 'Seed User3',
			password: '13e3b57d2130ef454db3e9a8645da7eb9b67e3c1ec472cd10c27106ca582cac619e7efb0', // 321321
			salt: '9eae2ad71fc1dd2a071e4284aded85c4'
		})
	)
}

/* eslint-disable max-len */

exports.seed = function (knex, Promise)
{
	return knex('users').del()
	.then(() =>
	{
		return knex('auth_local').del()
	})
	.then(() =>
	{
		return Promise.join(
			knex('users')
			.insert(
			{
				email: 'seed.1@user.com',
				first_name: 'Seed',
				last_name: 'User1'
			}, 'id')
			.then(id =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
			}),

			knex('users')
			.insert(
			{
				email: 'seed.2@user.com',
				first_name: 'Seed',
				last_name: 'User2'
			}, 'id')
			.then(id =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
			}),

			knex('users')
			.insert(
			{
				email: 'seed.3@user.com',
				first_name: 'Seed',
				last_name: 'User3'
			}, 'id')
			.then(id =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
			})
		)
	})
}

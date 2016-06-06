/* eslint-disable max-len */

var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
	'eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad m' +
	'inim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip e' +
	'x ea commodo consequat. Duis aute irure dolor in reprehenderit in volupt' +
	'ate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint oc' +
	'caecat cupidatat non proident, sunt in culpa qui officia deserunt mollit' +
	' anim id est laborum.'

exports.seed = function (knex, Promise)
{
	var hist_returns_default = JSON.stringify(
	[
		{ year: 2011, percentage: 10 },
		{ year: 2012, percentage: 11 },
		{ year: 2013, percentage: -8 },
		{ year: 2014, percentage: 5 },
		{ year: 2015, percentage: 15 },
	])
	/**
	 * Algo:
	 * 1. Take all existing investors and update them to new format
	 * 2. Create more Investors
	 */
	return knex('investors').del()
	.then(() =>
	{
		return Promise.join(
			knex('users')
			.insert(
			{
				email: 'allen.schwartz@investor.com',
				first_name: 'Allen',
				last_name: 'Schwartz',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Technology',
						'Retirement',
						'Long Term Growth'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Lawyer',
						focus: focus,
						profile_pic: '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b',
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'george.masterson@investor.com',
				first_name: 'George',
				last_name: 'Masterson',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Long Term Growth',
						'Retirement'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Preacher',
						focus: focus,
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'burt.harris@investor.com',
				first_name: 'Burt',
				last_name: 'Harris',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Conservative',
						'Income'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Developer',
						focus: focus,
						profile_pic: '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b',
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'anna.brinkley@investor.com',
				first_name: 'Anna',
				last_name: 'Brinkley',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Technology',
						'Retirement',
						'Long Term Growth'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Teacher',
						focus: focus,
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'david.philips@investor.com',
				first_name: 'David',
				last_name: 'M. Philips',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Technology',
						'Retirement',
						'Long Term Growth'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Witcher',
						focus: focus,
						profile_pic: '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b',
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'chaenne.parson@investor.com',
				first_name: 'Chaenne',
				last_name: 'Parson',
				pic: '/api/static/pic/ee11cbb19052e40b07aac0ca060c23ee'
			}, 'id')
			.then((user_id) =>
			{
				return knex('auth_local')
				.insert(
				{
					user_id: user_id[0],
					password: '4d4bf931bb840b74c0349879be5eeebc786e21b9fc7b05e272bb0fe402d54b8559def007', // 321321
					salt: 'e37b739fbfa92ad861f05594786be5a8'
				})
				.then(() =>
				{
					var focus = JSON.stringify(
					[
						'Income',
						'Retirement',
						'Outcome'
					])

					return knex('investors')
					.insert(
					{
						user_id: user_id[0],
						profession: 'Liar',
						focus: focus,
						background: lorem,
						historical_returns: hist_returns_default,
						is_public: true,
						start_date: new Date()
					})
				})
			})
		)
	})
}

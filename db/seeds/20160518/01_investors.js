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
				last_name: 'Schwartz'
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
						first_name: 'Allen',
						last_name: 'Schwartz',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Lawyer',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'george.masterson@investor.com',
				first_name: 'George',
				last_name: 'Masterson'
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
						first_name: 'George',
						last_name: 'Masterson',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Preacher',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'burt.harris@investor.com',
				first_name: 'Burt',
				last_name: 'Harris'
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
						first_name: 'Burt',
						last_name: 'Harris',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Developer',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'anna.brinkley@investor.com',
				first_name: 'Anna',
				last_name: 'Brinkley'
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
						first_name: 'Anna',
						last_name: 'Brinkley',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Teacher',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'david.philips@investor.com',
				first_name: 'David',
				last_name: 'M. Philips'
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
						first_name: 'David',
						last_name: 'M. Philips',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Witcher',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			}),

			knex('users')
			.insert(
			{
				email: 'chaenne.parson@investor.com',
				first_name: 'Chaenne',
				last_name: 'Parson'
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
						first_name: 'Chaenne',
						last_name: 'Parson',
						icon: 'http://image.tmdb.org/t/p/w342/811DjJTon9gD6hZ8nCjSitaIXFQ.jpg',
						cover_image: 'http://playtusu.com/wp-content/uploads/2014/06/7526.png',
						profession: 'Liar',
						focus: focus,
						background: lorem,
						is_public: true
					})
				})
			})
		)
	})
}

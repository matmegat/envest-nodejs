
exports.up = function (knex, Promise)
{
	/*
	* Add column "first_name" to users
	* Add column "last_name" to users
	* Remove column "full_name" from users
	* */


	return Promise.resolve()
	.then(() =>
	{
		return knex('comments').del()
	})
	.then(() =>
	{
		return knex('feed_items').del()
	})
	.then(() =>
	{
		return knex('investors').del()
	})
	.then(() =>
	{
		return knex('users').del()
	})
	.then(() =>
	{
		return knex('auth_local').del()
	})
	.then(() =>
	{
		return knex('email_confirms').del()
	})
	.then(() =>
	{
		return knex('auth_facebook').del()
	})
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.dropColumn('full_name')
			table.string('first_name').notNullable()
			table.string('last_name').notNullable()
		})
	})
}

exports.down = function (knex, Promise)
{
	/*
	* Remove column "first_name" to users
	* Remove column "last_name" to users
	* Add column "full_name" from users
	* */

	return Promise.resolve()
	
	.then(() =>
	{
		return knex('comments').del()
	})
	.then(() =>
	{
		return knex('feed_items').del()
	})
	.then(() =>
	{
		return knex('investors').del()
	})
	.then(() =>
	{
		return knex('users').del()
	})
	.then(() =>
	{
		return knex('auth_local').del()
	})
	.then(() =>
	{
		return knex('email_confirms').del()
	})
	.then(() =>
	{
		return knex('auth_facebook').del()
	})
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.dropColumns('first_name', 'last_name')
			table.string('full_name').notNullable()
		})
	})
}

var investorProfilePic = '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b'
/* TODO: fill with real links / hashes */

module.exports = function Investors (knex, Promise)
{
	var investors = {}

	investors.initialUp = knex.schema.createTable('investors', (table) =>
	{
		table.increments('id').primary()

		table.timestamps() // created_at, updated_at

		table.string('first_name').notNullable()
		table.string('last_name').notNullable()
		table.text('profile_pic').defaultTo(investorProfilePic)
		// table.string('icon', 255).notNullable()
	})

	investors.initialDown = knex.schema.dropTableIfExists('investors')

	/*
	* Second Migration
	* */

	investors.secondUp = knex.schema.table('investors', (table) =>
	{
		// table.increments('id').primary()
		// table.string('icon', 512).notNullable()

		table.dropPrimary()
		table.dropColumns('id', 'created_at', 'updated_at')

		table.integer('user_id').primary().unique().notNullable()
		.references('users.id')
		.onUpdate('restrict') /* user.id should never change */
		.onDelete('restrict') /* we don't want to accidentally delete investor */

		// table.renameColumn('full_name', 'first_name')
		// table.string('last_name').after('first_name')
		// table.string('cover_image', 255).notNullable().defaultTo('')
		table.string('profession').defaultTo('')
		table.jsonb('focus').defaultTo('[]') // [String, ]. Up to 3 elements
		table.text('background').defaultTo('')
		table.jsonb('historical_returns').notNullable().defaultTo(
			JSON.stringify(
				[
					{ year: 2011, percentage: 10 },
					{ year: 2012, percentage: 11 },
					{ year: 2013, percentage: -8 },
					{ year: 2014, percentage: 5 },
					{ year: 2015, percentage: 15 },
				])
		)

		table.boolean('is_public').defaultTo(false)
	})

	investors.secondDown = function ()
	{
		/*
		* drop Foreign Key of feed_items
		* back to previous investors version
		* create new Foreign Key for feed_items
		* run seed data
		* */

		return Promise.resolve()
		.then(() =>
		{
			return knex.schema.table('feed_items', (table) =>
			{
				table.dropForeign('investor_id')
			})
		})
		.then(() =>
		{
			return knex.schema.table('investors', (table) =>
			{
				table.dropPrimary('user_id')

				table.dropColumns(
					'user_id',
					'profession',
					'focus',
					'background',
					'historical_returns',
					'is_public'
				)
			})
		})
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
			return knex.schema.table('investors', (table) =>
			{
				table.increments('id').primary()
				table.timestamps() // created_at, updated_at
			})
		})
		.then(() =>
		{
			return knex.schema.table('feed_items', (table) =>
			{
				table
				.foreign('investor_id')
				.references('investors.id')
				.onUpdate('cascade')
				.onDelete('cascade')
			})
		})
		.then(() =>
		{
			return knex.seed.run({ directory: './seeds/20160505' })
		})
	}

	return investors
}

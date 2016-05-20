module.exports = function Investors (knex)
{
	var investors = {}

	investors.initialUp = knex.schema.createTable('investors', (table) =>
	{
		table.increments('id').primary()

		table.timestamps() // created_at, updated_at

		table.string('full_name').notNullable()
		table.string('icon', 512).notNullable()
	})

	investors.initialDown = knex.schema.dropTableIfExists('investors')

	/*
	* Second Migration
	* */

	investors.secondUp = knex.schema.table('investors', (table) =>
	{
		// table.increments('id').primary()
		// table.string('icon', 512).notNullable()

		table.dropColumns('created_at', 'updated_at')

		table.integer('user_id').unique().notNullable()
		.references('users.id')
		.onUpdate('restrict') /* user.id should never change */
		.onDelete('restrict') /* we don't want to accidentally delete investor */

		table.renameColumn('full_name', 'first_name')
		table.string('last_name').after('first_name')
		table.string('cover_image', 512).notNullable().defaultTo('')
		table.string('profession').defaultTo('')
		table.jsonb('focus').defaultTo(JSON.stringify([]))	// [String, ]. Up to 3 elements
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

	investors.secondDown = knex.schema.table('investors', (table) =>
	{
		table.timestamps() // created_at, updated_at
		table.renameColumn('first_name', 'full_name')

		table.dropColumns(
			'user_id',
			'last_name',
			'cover_image',
			'profession',
			'focus',
			'background',
			'historical_returns',
			'is_public'
		)
	})

	return investors
}

var investorProfilePic = '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b'
/* TODO: fill with real links / hashes */

module.exports = function Investors (knex, Promise)
{
	var investors = {}

	investors.initialUp = knex.schema.createTable('investors', (table) =>
	{
		table.integer('user_id').primary().unique().notNullable()
		.references('users.id')
		.onUpdate('restrict') /* user.id should never change */
		.onDelete('restrict')

		table.string('first_name').notNullable()
		table.string('last_name').notNullable()
		table.text('profile_pic').defaultTo(investorProfilePic)
		table.string('profession').defaultTo('')
		table.jsonb('focus').defaultTo('[]')
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

	investors.initialDown = knex.schema.dropTableIfExists('investors')

	return investors
}

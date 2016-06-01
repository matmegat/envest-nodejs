var investorProfilePic = '/api/static/pic/b4f18f5b05307bd1e3cc00e0802d641b'

exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('investors', (table) =>
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
	})
	.then(() =>
	{
		return knex.schema.createTable('feed_items', (table) =>
		{
			table.increments('id').primary()

			table.timestamp('timestamp').defaultTo(knex.fn.now())
			table.integer('investor_id').notNullable()
			table.foreign('investor_id')
				.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')
			table.string('event_type').notNullable()
			table.jsonb('event').notNullable()
			/* TODO: should follow notation
			* {
			* 	type: 'trade' | 'watchlist' | 'update'
			* 	data:
			* 	{
			*		dir:
			*		symbol:
			*		price:
			*		amount:
			*		text:
			*		risk: 'low' | 'medium' | 'high'
			*		motivations: []
			* 	}
			* }
			* */
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('comments', (table) =>
		{
			table.increments('id').primary()

			table.timestamp('timestamp').defaultTo(knex.fn.now())
			table.integer('user_id').notNullable()
			table.foreign('user_id')
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.integer('feed_id').notNullable()
			table.foreign('feed_id')
				.references('feed_items.id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.text('text').notNullable()
		})
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('comments'),
		knex.schema.dropTableIfExists('feed_items'),
		knex.schema.dropTableIfExists('investors')
	])
}

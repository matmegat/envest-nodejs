var Investors = require('./../investor_migration')

exports.up = function (knex, Promise)
{
	var investor_migration = Investors(knex)

	return Promise.resolve()
		.then(() =>
		{
			return investor_migration.initialUp
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
				table.foreign('user_id').references('users.id')

				table.integer('feed_id').notNullable()
				table.foreign('feed_id').references('feed_items.id')

				table.text('text').notNullable()
			})
		})
		// .then(() =>
		// {
		// 	return knex.seed.run({ directory: './seeds/20160505' })
		// })
}

exports.down = function (knex, Promise)
{
	var investor_migration = Investors(knex)

	return Promise.all(
	[
		knex.schema.dropTableIfExists('comments'),
		knex.schema.dropTableIfExists('feed_items'),
		investor_migration.initialDown
	])
}

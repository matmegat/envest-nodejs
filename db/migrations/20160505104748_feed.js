
exports.up = function (knex, Promise)
{
	return Promise.resolve()
		.then(() =>
		{
			console.info('Create Table for Investors')

			return knex.schema.createTable('investors', (table) =>
			{
				table.increments('id').primary()

				table.timestamps()	//	created_at, updated_at

				table.string('full_name').notNullable()
				table.string('icon', 512).notNullable()
			})
		})
		.then(() =>
		{
			console.info('Create Table for Feed')

			return knex.schema.createTable('feed_items', (table) =>
			{
				table.increments('id').primary()

				table.timestamp('timestamp').defaultTo(knex.fn.now())
				table.integer('investor_id').notNullable()
				table.foreign('investor_id').references('investors.id')
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
			console.info('Create Table for Comments')

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
		.then(() =>
		{
			knex.seed.run()
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


exports.up = function (knex, Promise)
{
	return Promise.resolve()
		.then(() =>
		{
			console.info('Create Table for Motivations')

			return knex.schema.createTable('motivations', (table) =>
			{
				table.increments('id').primary()

				table.string('category_name').notNullable()
				table.string('title').notNullable()
				table.string('icon', 512).notNullable()
			})
		})
		.then(() =>
		{
			console.info('Create Table for Feed')

			return knex.schema.createTable('posts', (table) =>
			{
				table.increments('id').primary()

				table.timestamp('timestamp').defaultTo(knex.fn.now())
				table.integer('invetor_id').notNullable()
				// TODO: update on adding table for Investor
				// table.foreign('invetor_id').references('investor.id')
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

				table.integer('user_id').notNullable()
				table.foreign('user_id').references('users.id')

				table.integer('post_id').notNullable()
				table.foreign('post_id').references('posts.id')

				table.text('text').notNullable()
			})
		})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('comments'),
		knex.schema.dropTableIfExists('posts'),
		knex.schema.dropTableIfExists('motivations')
	])
}

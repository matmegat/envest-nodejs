
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('investors', (table) =>
		{
			table.integer('user_id').primary().unique().notNullable()
			.references('users.id')
			.onUpdate('cascade')
			.onDelete('cascade')

			table.text('profile_pic').nullable()
			table.string('profession').defaultTo('')
			table.jsonb('focus').defaultTo('[]')
			table.text('background').defaultTo('')
			table.jsonb('historical_returns').notNullable().defaultTo('[]')
			table.boolean('is_public').notNullable().defaultTo(false)
			table.timestamp('start_date').nullable()
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
			table.string('type').notNullable()
			table.jsonb('data').notNullable()
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

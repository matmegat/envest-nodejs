
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('notifications', (table) =>
		{
			table.increments('id').primary()

			table.timestamp('timestamp').defaultTo(knex.fn.now())

			table.string('type').notNullable()
			table.jsonb('event').notNullable()

			table.integer('recipient_id')
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('notifications_viewed', (table) =>
		{
			table.integer('recipient_id').primary()
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.integer('last_viewed_id').notNullable()
		})
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('notifications'),
		knex.schema.dropTableIfExists('notifications_viewed'),
	])
}

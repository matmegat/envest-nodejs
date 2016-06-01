
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
			table.boolean('is_viewed').notNullable()

			table.integer('recipient_id')
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')
		})
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('notifications'),
	])
}

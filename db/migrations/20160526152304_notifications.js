
exports.up = function (knex)
{
	return knex.schema.createTable('notifications', (table) =>
	{
		table.increments('id').primary()

		table.timestamp('timestamp').defaultTo(knex.fn.now())

		table.string('type').notNullable()
		table.jsonb('event').notNullable()

		table.boolean('is_viewed').notNullable()
			.defaultTo(false)

		table.integer('recipient_id')
			.references('users.id')
			.onUpdate('cascade')
			.onDelete('cascade')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('notifications'),
}


exports.up = function (knex)
{
	return knex.schema.createTable('subscriptions', (table) =>
	{
		table.increments('id').primary()

		table.timestamp('start_time').defaultTo(knex.fn.now())
		table.timestamp('end_time')

		table.string('type').notNullable()

		table.integer('user_id')
			.references('users.id')
			.onUpdate('cascade')
			.onDelete('cascade')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('subscriptions')
}


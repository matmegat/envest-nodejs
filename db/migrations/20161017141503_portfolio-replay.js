
exports.up = function (knex)
{
	return knex.schema.createTable('tradeops', table =>
	{
		table.integer('investor_id').notNullable()
		.references('investors.user_id')
			.onUpdate('cascade')
			.onDelete('cascade')

		table.timestamp('timestamp').notNullable()
			// .defaultTo(knex.fn.now())

		table.string('type').notNullable()

		table.jsonb('data').notNullable()

		table.primary([ 'investor_id', 'timestamp' ]
			, 'timed_tradeop_unique')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('tradeops')
}

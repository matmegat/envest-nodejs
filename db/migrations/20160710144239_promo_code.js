
exports.up = function (knex)
{
	return knex.schema.createTable('promo_codes', (table) =>
	{
		table.increments('id').primary()

		table.timestamp('end_time')

		table.integer('activations')

		table.string('type')
		.notNullable()

		table.string('code')
		.notNullable()
		.unique()
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('promo_codes')
}


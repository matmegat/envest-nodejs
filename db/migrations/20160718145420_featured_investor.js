
exports.up = function (knex)
{
	return knex.schema.createTable('featured_investor', (table) =>
	{
		table.integer('investor_id').primary()
			.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('restrict')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('featured_investor')
}

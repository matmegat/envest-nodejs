
exports.up = function (knex)
{
	return knex.schema.table('notifications', (table) =>
	{
		table.string('target').notNullable()
	})
}

exports.down = function (knex)
{
	return knex.schema.table('notifications', (table) =>
	{
		table.dropColumn('target')
	})
}

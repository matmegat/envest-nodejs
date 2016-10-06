
exports.up = function (knex)
{
	return knex.schema.table('investors', (table) =>
	{
		table.float('annual_return').notNullable().defaultTo(0)
	})
}

exports.down = function (knex)
{
	return knex.schema.table('investors', (table) =>
	{
		table.dropColumn('annual_return')
	})
}

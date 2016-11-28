
exports.up = function (knex)
{
	return knex.schema.table('subscriptions', (table) =>
	{
		table.string('status').notNullable().defaultTo('active')
	})
}

exports.down = function (knex)
{
	return knex.schema.table('subscriptions', (table) =>
	{
		table.dropColumn('string')
	})
}

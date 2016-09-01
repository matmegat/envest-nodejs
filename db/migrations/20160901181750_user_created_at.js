
exports.up = function (knex)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.timestamp('created_at').defaultTo(knex.fn.now())
		})
	})
	.then(() =>
	{
		return knex('users')
		.update({ created_at: '2016-05-01 18:20:06.828532+03'})
	})
}

exports.down = function (knex)
{
	return knex.schema.table('users', (table) =>
	{
		table.dropColumn('created_at')
	})
}

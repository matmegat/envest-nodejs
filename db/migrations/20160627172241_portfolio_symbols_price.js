
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('portfolio_symbols', (table) =>
		{
			table.decimal('buy_price', 10, 4)
			.notNullable()
			.defaultTo(7.62)
		})
	})
}

exports.down = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('portfolio_symbols', (table) =>
		{
			table.dropColumn('buy_price')
		})
	})
}


exports.up = function (knex)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('investors', (table) =>
		{
			table.jsonb('education').defaultTo('[]')
		})
	})
	.then(() =>
	{
		return knex('investors')
		.where('is_public', true)
		.update({ education: '["Investor"]' })
	})
}

exports.down = function (knex)
{
	return knex.schema.table('investors', (table) =>
	{
		table.dropColumn('education')
	})
}


exports.up = function (knex)
{
	return knex.schema.createTable('abuse_comments', (table) =>
	{
		table.integer('user_id').notNullable()
		table.integer('comment_id').notNullable().unique()
		table.timestamp('timestamp').defaultTo(knex.fn.now())
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('abuse_comments')
}
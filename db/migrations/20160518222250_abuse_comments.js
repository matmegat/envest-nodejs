
exports.up = function (knex)
{
	return knex.schema.createTable('abuse_comments', (table) =>
	{
		table.integer('user_id')
		table.integer('comment_id')
		table.timestamp('timestamp').defaultTo(knex.fn.now())
		table.primary(['user_id', 'comment_id'])
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('abuse_comments')
}

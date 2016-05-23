
exports.up = function (knex)
{
	return knex.schema.createTable('abuse_comments', (table) =>
	{
		table.integer('user_id')
			.references('users.id')
			.onUpdate('cascade')
			.onDelete('cascade')

		table.integer('comment_id')
			.references('comments.id')
			.onUpdate('cascade')
			.onDelete('cascade')

		table.timestamp('timestamp').defaultTo(knex.fn.now())
		table.primary([ 'user_id', 'comment_id' ])
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('abuse_comments')
}

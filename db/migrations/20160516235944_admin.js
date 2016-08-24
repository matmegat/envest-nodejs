
exports.up = function (knex)
{
	return knex.schema.createTable('admins', (table) =>
	{
		table.integer('user_id').primary()
			.references('users.id')
			.onUpdate('cascade') /* user.id should never change */
			.onDelete('cascade') /* we don't want to accidentally delete admin */

		table.integer('parent').nullable()
			.references('admins.user_id')
			.onUpdate('cascade')
			.onDelete('cascade')
			.comment('another admin who introduced this admin')

		table.boolean('can_intro').notNullable().default(false)
			.comment('can this admin introduce another')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('admins')
}

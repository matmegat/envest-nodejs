
exports.up = function (knex)
{
	return knex.schema.createTable('admins', (table) =>
	{
		table.increments('id').primary()

		table.integer('user_id').unique().notNullable()
			.references('users.id')
			.onUpdate('restrict') /* user.id should never change */
			.onDelete('restrict') /* we don't want to accidentally delete admin */

		table.integer('parent').nullable()
			.references('admins.id')
			.onUpdate('restrict')
			.onDelete('restrict')
			.comment('another admin who introduced this admin')

		table.boolean('can_intro').default(false)
			.comment('can this admin introduce another')
	})
}

exports.down = function (knex)
{
	return knex.schema.dropTableIfExists('admins')
}

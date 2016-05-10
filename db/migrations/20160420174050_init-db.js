
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('users', (table) =>
		{
			table.increments('id').primary()

			table.string('full_name').notNullable()

			table.string('email').unique()
			table.string('password', 72).notNullable()
			table.string('salt', 32).notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('email_confirms', (table) =>
		{
			table.integer('user_id').primary()

			table.string('new_email').notNullable().unique()
			table.string('code', 32).notNullable()
		})
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('users'),
		knex.schema.dropTableIfExists('email_confirms'),
	])
}

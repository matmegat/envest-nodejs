
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('users', (table) =>
		{
			table.increments('id').primary()

			table.string('first_name').notNullable()
			table.string('last_name').notNullable()

			table.string('email')
			table.string('password', 36).notNullable()
			table.string('salt', 16).notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('email_confirms', (table) =>
		{
			table.string('new_email').primary()
			table.string('code', 16).notNullable()
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

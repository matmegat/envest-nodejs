
exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('users', (table) =>
		{
			table.increments('id').primary()

			table.string('full_name').notNullable()
			table.string('email')
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('auth_local', (table) =>
		{
			table.integer('user_id').primary()

			table.string('password', 36).notNullable()
			table.string('salt', 16).notNullable()
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
	.then(() =>
	{
		return knex.schema.createTable('auth_facebook', (table) =>
		{
			table.integer('user_id').primary()

			table.bigInteger('facebook_id').notNullable().unique()
		})
	})
	.then(() =>
	{
		return knex.seed.run({ directory: './seeds/20160420' })
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('users'),
		knex.schema.dropTableIfExists('email_confirms'),
		knex.schema.dropTableIfExists('auth_local'),
		knex.schema.dropTableIfExists('auth_facebook')
	])
}

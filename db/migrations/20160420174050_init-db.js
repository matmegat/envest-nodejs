
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
			table.text('pic').nullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('auth_local', (table) =>
		{
			table.integer('user_id').primary()
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')


			table.string('password', 72).notNullable()
			table.string('salt', 32).notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('email_confirms', (table) =>
		{
			table.integer('user_id').primary()
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.string('new_email').notNullable().unique()
			table.string('code', 32).notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('pass_reset', (table) =>
		{
			table.integer('user_id').primary()
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.timestamp('timestamp').defaultTo(knex.fn.now())
			table.string('code', 32).notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('auth_facebook', (table) =>
		{
			table.integer('user_id').primary()
				.references('users.id')
				.onUpdate('cascade')
				.onDelete('cascade')

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
		knex.schema.dropTableIfExists('pass_reset'),
		knex.schema.dropTableIfExists('auth_local'),
		knex.schema.dropTableIfExists('auth_facebook')
	])
}

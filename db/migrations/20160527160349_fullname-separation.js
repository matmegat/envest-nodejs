
exports.up = function (knex, Promise)
{
	/*
	* Add column "first_name" to users
	* Add column "last_name" to users
	* Remove column "full_name" from users
	* */

	Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.dropColumn('full_name')
			table.string('first_name').notNullable()
			table.string('last_name').notNullable()
		})
	})
}

exports.down = function (knex, Promise)
{
	/*
	* Remove column "first_name" to users
	* Remove column "last_name" to users
	* Add column "full_name" from users
	* */

	Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.dropColumn('first_name')
			table.dropColumn('last_name')
			table.string('full_name').notNullable()
		})
	})
}

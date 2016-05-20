
var istx = require('./is-tx')

/*
 * return knex table constructor
 *
 * example:
 *  var users = knexed(knex, 'users')
 *
 *  now
 *    users() -> knex table
 *  in transaction you can do
 *    users(tx) -> same knex table but added in transaction tx
 */
var knexed = module.exports = function knexed (knex, table_name)
{
	return function knex_table (tx)
	{
		var table = knex(table_name)

		if (istx(tx))
		{
			table.transacting(tx)
		}

		return table
	}
}


var Watchlist = require('../../src/db/models/watchlist/Watchlist')
var schema = Watchlist.schema

exports.up = function (knex)
{
	return Promise.all([
		knex.schema.createTable(schema.user.table_name, (table) =>
		{
			schema.user(table)
		}),
		knex.schema.createTable(schema.investor.table_name, (table) =>
		{
			schema.investor(table)
		})
	])
}

exports.down = function (knex)
{
	return Promise.all([
		knex.schema.dropTableIfExists(schema.user.table_name),
		knex.schema.dropTableIfExists(schema.investor.table_name),
	])
}


var Symbols = require('../../src/db/models/symbols/Symbols')

exports.up = function (knex)
{
	return Promise.all(
	[
		knex.schema.createTableIfNotExists('portfolio_prec', table =>
		{
			table.integer('investor_id').notNullable()
			.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')

			Symbols.schema.columns('symbol_', table) // REF symbols

			table.timestamp('timestamp').notNullable()
				.defaultTo(knex.fn.now())

			table.float('amount').notNullable()

			table.float('price').notNullable()

			table.primary(
				[ 'investor_id', 'symbol_exchange', 'symbol_ticker', 'timestamp' ]
				, 'prec_timed_portfolio_point_unique'
			)
		})
	])
}

exports.down = function (knex)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('portfolio_prec')
	])
}

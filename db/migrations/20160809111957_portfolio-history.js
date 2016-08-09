
var Symbols = require('../../src/db/models/symbols/Symbols')

exports.up = (knex) =>
{
	// knex.schema.dropTableIfExists('portfolio_symbols')

	return knex.schema.createTable('portfolio', (table) =>
	{
		table.integer('investor_id').notNullable()
		.references('investors.user_id')
			.onUpdate('cascade')
			.onDelete('cascade')

		Symbols.schema.columns('symbol_', table) // REF symbols

		table.timestamp('timestamp').notNullable()
			.defaultTo(knex.fn.now())

		table.integer('amount').notNullable()

		table.decimal('price', 12, 2)
			.notNullable()

		table.primary(
		[
			'investor_id',
			'symbol_exchange',
			'symbol_ticker',
			'timestamp'
		]
		, 'timed_portfolio_symbol_unique')
	})
}

exports.down = (knex) =>
{
	return knex.schema.dropTableIfExists('portfolio')
}

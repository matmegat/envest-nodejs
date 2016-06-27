
var symbol = require('../../src/db/models/symbol/Symbol')

exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.createTable('brokerage', (table) =>
		{
			// Amount of Investor's cash
			table.integer('investor_id').primary()
			.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.decimal('cash_value', 12, 2).notNullable()
			/*
			* precision: up to 9 999 999 999
			* scale: 0.99
			* */
			table.float('multiplier').notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('symbols', (table) =>
		{
			symbol.schema.columns('', table)

			/* additional */
			table.string('company').notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('portfolio_symbols', (table) =>
		{
			table.increments('id').primary()

			table.integer('investor_id').notNullable()
				.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')

			symbol.schema.columns('symbol_', table) // REF symbols

			table.integer('amount').notNullable()
				.comment('Number of Shares')
		})

		// NOTE: Investors Full Portfolio = Brokerage + Sum(Portfolio Symbols)
	})
	.then(() =>
	{
		return knex.seed.run({ directory: './seeds/20160518' })
	})
}

exports.down = function (knex, Promise)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('portfolio_symbols'),
		knex.schema.dropTableIfExists('symbols'),
		knex.schema.dropTableIfExists('brokerage')
	])
}

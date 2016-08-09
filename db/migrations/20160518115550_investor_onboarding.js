/* eslint-disable no-unreachable */

var Symbols = require('../../src/db/models/symbols/Symbols')

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
		return /* do not create this one in favor of portfolio-history */

		return knex.schema.createTable('portfolio_symbols', (table) =>
		{
			table.increments('id').primary()

			table.integer('investor_id').notNullable()
				.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')

			Symbols.schema.columns('symbol_', table) // REF symbols

			table.integer('amount').notNullable()
				.comment('Number of Shares')

			table.decimal('buy_price', 10, 4)
				.notNullable()
				.defaultTo(7.62)

			table.unique([ 'investor_id', 'symbol_exchange', 'symbol_ticker' ],
				'portfolio_symbol_unique')
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

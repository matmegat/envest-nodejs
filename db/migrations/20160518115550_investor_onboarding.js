var Investors = require('./../investor_migration')

exports.up = function (knex, Promise)
{
	var investor_migration = Investors(knex)

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
			table.increments('id').primary()
			table.string('ticker').notNullable()
			table.string('company').notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('portfolio_symbols', (table) =>
		{
			table.increments('id').primary()
			table.integer('amount').notNullable().comment('Number of Shares')

			table.integer('investor_id')
			.notNullable()
			.references('investors.user_id')
			.onUpdate('cascade')
			.onDelete('cascade')

			table.integer('symbol_id')
			.notNullable()
			.references('symbols.id')
			.onUpdate('cascade')
			.onDelete('cascade')
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
	var investor_migration = Investors(knex, Promise)

	return knex.schema.dropTableIfExists('portfolio_symbols')
	.then(() =>
	{
		return knex.schema.dropTableIfExists('symbols')
	})
	.then(() =>
	{
		return knex.schema.dropTableIfExists('brokerage')
	})
}

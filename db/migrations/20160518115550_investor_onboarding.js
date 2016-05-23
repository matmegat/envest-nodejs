var Investors = require('./../investor_migration')

exports.up = function (knex, Promise)
{
	var investor_migration = Investors(knex)

	return Promise.resolve()
	.then(() => {
		return knex('comments').del()
	})
	.then(() =>
	{
		return knex('feed_items').del()
	})
	.then(() =>
	{
		return knex('investors').del()
	})
	.then(() =>
	{
		return investor_migration.secondUp
	})
	.then(() =>
	{
		return knex.schema.createTable('brokerage', (table) =>
		{
			// Amount of Investor's cash
			table.integer('investor_id').primary()
			table.foreign('investor_id').references('investors.id')

			table.decimal('cash_value', 12, 2).notNullable()
			/*
			* precision: 12 - up to 999 999 999 999
			* scale: .99
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

			table.integer('investor_id').notNullable()
			table.foreign('investor_id').references('investors.id')

			table.integer('symbol_id')
			table.foreign('symbol_id').references('symbols.id')
		})

		// NOTE: Investors Full Portfolio = Brokerage + Sum(Portfolio Symbols)
	})
	.then(() =>
	{
		return knex.seed.run({ directory: './seeds/20160518' })
	})
}

exports.down = function (knex, Promise) {
	var investor_migration = Investors(knex)

	return Promise
	.join(
		knex.schema.dropTableIfExists('portfolio_symbols'),
		knex.schema.dropTableIfExists('symbols'),
		knex.schema.dropTableIfExists('brokerage'),
		investor_migration.secondDown
	)
}

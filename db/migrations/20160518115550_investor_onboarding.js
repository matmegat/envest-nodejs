var Investors = require('./../investor_migration')

exports.up = function (knex, Promise)
{
	var investor_migration = Investors(knex)

	return Promise.resolve()
	.then(() =>
	{
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
		return knex.schema.table('feed_items', (table) =>
		{
			table.dropForeign('investor_id')
		})
	})
	.then(() =>
	{
		return investor_migration.secondUp
	})
	.then(() =>
	{
		return knex.schema.table('feed_items', (table) =>
		{
			table
				.foreign('investor_id')
				.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('brokerage', (table) =>
		{
			// Amount of Investor's cash
			table.integer('investor_id')
			.primary()
			.unique()
			.references('investors.user_id')
			.onUpdate('cascade')
			.onDelete('cascade')

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
	// TODO: Rewrite to investor_migration.secondDown

	return knex.schema.dropTableIfExists('portfolio_symbols')
	.then(() =>
	{
		return knex.schema.dropTableIfExists('symbols')
	})
	.then(() =>
	{
		return knex.schema.dropTableIfExists('brokerage')
	})
	.then(() =>
	{
		return knex.schema.table('feed_items', (table) =>
		{
			table.dropForeign('investor_id')
		})
	})
	.then(() =>
	{
		return knex.schema.table('investors', (table) =>
		{
			table.dropPrimary('user_id')

			table.dropColumns(
				'user_id',
				'last_name',
				'cover_image',
				'profession',
				'focus',
				'background',
				'historical_returns',
				'is_public'
			)
		})
	})
	.then(() =>
	{
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
		return knex.schema.table('investors', (table) =>
		{
			table.increments('id').primary()
			table.timestamps() // created_at, updated_at
			table.renameColumn('first_name', 'full_name')
		})
	})
	.then(() =>
	{
		return knex.schema.table('feed_items', (table) =>
		{
			table
			.foreign('investor_id')
			.references('investors.id')
			.onUpdate('cascade')
			.onDelete('cascade')
		})
	})
}

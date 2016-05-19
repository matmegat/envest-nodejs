exports.up = function (knex, Promise)
{
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
		return knex.schema.table('investors', (table) =>
		{
			table.dropColumn('created_at')
			table.dropColumn('updated_at')
			table.timestamp('timestamp').defaultTo(knex.fn.now())

			table.integer('user_id').notNullable()
			table.foreign('user_id').references('users.id')

			table.dropColumn('full_name')
			table.string('first_name', 72)
			table.string('last_name', 72)
			table.string('profession').defaultTo('')
			table.jsonb('focus').defaultTo(JSON.stringify([]))	// [String, ]. Up to 3 elements
			table.text('background').defaultTo('')
			table.jsonb('historical_returns').notNullable().defaultTo(
				JSON.stringify(
				[
					{ year: 2011, percentage: 10 },
					{ year: 2012, percentage: 11 },
					{ year: 2013, percentage: -8 },
					{ year: 2014, percentage: 5 },
					{ year: 2015, percentage: 15 },
				])
			)

			table.boolean('is_public').defaultTo(false)
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('brokerage', (table) =>
		{
			// Amount of Investor's cash
			table.integer('investor_id').primary()
			table.foreign('investor_id').references('investors.id')

			table.decimal('cash_value').notNullable()
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
}

exports.down = function (knex, Promise) {
	return Promise
	.join(
		knex.schema.dropTableIfExists('portfolio_symbols'),
		knex.schema.dropTableIfExists('symbols')
		// knex.schema.dropTableIfExists('investors')
	)
}

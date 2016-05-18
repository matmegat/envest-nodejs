exports.up = function (knex, Promise)
{
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('investors', (table) =>
		{
			// TODO: create updated_at trigger http://goo.gl/FLK4kT

			table.dropColumn('full_name')
			table.string('first_name', 72).notNullable().defaultTo('First_Name')
			table.string('last_name', 72).notNullable().defaultTo('Last_Name')
			table.string('email').notNullable().defaultTo('fake@email')
			table.string('profession')
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
			table.increments('id').primary()

			table.timestamps(true)
			// TODO: create updated_at trigger http://goo.gl/FLK4kT

			table.integer('investor_id').notNullable()
			table.foreign('investor_id').references('investors.id')

			table.float('real').notNullable()
			table.float('ratio').notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('stocks', (table) =>
		{
			table.increments('id').primary()

			table.timestamp('timestamp').defaultTo(knex.fn.now())
			table.string('ticker').notNullable()
			table.string('company').notNullable()
		})
	})
	.then(() =>
	{
		return knex.schema.createTable('portfolio', (table) =>
		{
			table.increments('id').primary()

			table.timestamps(true)
			// TODO: create updated_at trigger http://goo.gl/FLK4kT

			table.integer('amount').notNullable().comment('Number of Shares')
			table.float('price').notNullable().comment('Price per share')

			table.integer('stock_id')
			table.foreign('stock_id').references('stocks.id')
			// Could be null. If null - then its Cash
			// amount = 1
			// price = amount of cash
		})
	})
}

exports.down = function (knex, Promise) {
	return Promise
	.join(
		knex.schema.dropTableIfExists('portfolio'),
		knex.schema.dropTableIfExists('stocks'),
		// knex.schema.dropTableIfExists('investors')
	)
}

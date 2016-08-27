
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

		table.primary([ 'investor_id', 'timestamp' ]
			, 'timed_portfolio_point_unique')
	})
	.then(() =>
	{
		return knex.schema.dropTableIfExists('brokerage')
	})
	.then(() =>
	{
		return knex.schema.createTable('brokerage', (table) =>
		{
			table.integer('investor_id').notNullable()
			.references('investors.user_id')
				.onUpdate('cascade')
				.onDelete('cascade')

			table.timestamp('timestamp').notNullable()
				.defaultTo(knex.fn.now())

			table.decimal('cash', 12, 2).notNullable()
			table.float('multiplier').notNullable()

			table.primary([ 'investor_id', 'timestamp' ]
				, 'timed_brokerage_point_unique')
		})
	})
	.then(() =>
	{
		return knex.seed.run({ directory: './seeds/portfolio-history' })
	})
	.then(() =>
	{
		return knex.schema.raw(
`CREATE VIEW portfolio_current
(
  investor_id,
  symbol_exchange,
  symbol_ticker,
  amount,
  price
)
AS SELECT
  investor_id,
  symbol_exchange,
  symbol_ticker,
  amount,
  price

FROM
  portfolio AS P

WHERE amount > 0
  AND timestamp =
  (
    SELECT MAX(timestamp) FROM portfolio
    WHERE investor_id     = P.investor_id
      AND symbol_exchange = P.symbol_exchange
      AND symbol_ticker   = P.symbol_ticker
  );
`
		)
	})
}

exports.down = (knex) =>
{
	return knex.schema.raw('DROP VIEW portfolio_current')
	.then(() =>
	{
		return Promise.all([
			knex.schema.dropTableIfExists('portfolio'),
			knex.schema.dropTableIfExists('brokerage')
		])
	})
}

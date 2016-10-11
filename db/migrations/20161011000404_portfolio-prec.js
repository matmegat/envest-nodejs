
var raw = require('knex').raw

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
	.then(() =>
	{
		return Promise.all(
		[
			count_on(knex.from('portfolio')),
			count_on(knex.from('portfolio_prec'))
		])
	})
	.then(counts =>
	{
		console.info('old table rows: %s', counts[0])
		console.info('new table rows: %s', counts[1])
	})
	.then(() =>
	{
		return knex.raw(`INSERT INTO portfolio_prec SELECT * FROM portfolio;`)

		/* idempotent query */
		/* not working because of knex nag on `alter table "portfolio_prec"`
		   when table is already exists, so no use
		*/
/*		return knex.raw(
`INSERT INTO portfolio_prec
  (SELECT * FROM portfolio WHERE NOT EXISTS
    (SELECT * FROM portfolio_prec WHERE
      portfolio_prec.investor_id = portfolio.investor_id
     AND
      portfolio_prec.timestamp   = portfolio.timestamp
    ));
`)*/
	})
}

exports.down = function (knex)
{
	return Promise.all(
	[
		knex.schema.dropTableIfExists('portfolio_prec')
	])
}

function count_on (qs)
{
	return qs
	.select(raw('COUNT(*) AS count'))
	.then(it => it[0].count)
	.then(Number)
}

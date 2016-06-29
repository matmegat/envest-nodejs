var knexed = require('../../../knexed')
var upsert = require('../../../upsert')

var _ = require('lodash')

module.exports = function Holdings (db, investor)
{
	var holdings = {}

	var knex    = db.knex
	var helpers = db.helpers

	holdings.brokerage_table = knexed(knex, 'brokerage')
	holdings.holdings_table = knexed(knex, 'portfolio_symbols')



	function set_holdings (trx, data)
	{
		/* Expect data to be =
		* {
		*   investor_id: integer
		*   holdings:
		*   [
		*     {
		*       symbol_exchange: string,
		*       symbol_ticker:   string,
		*       amount:          integer,
		*       buy_price:       float
		*     },
		*     {},
		*   ]
		* }
		* */

		var where_clause = _.pick(data, ['investor_id'])

		return Promise.all(_.map(data.holdings, (holding, i) =>
		{
			var holdings_upsert = upsert(
				holdings.holdings_table(trx),
				'portfolio_symbols_investor_id_symbol_exchange_symbol_ticker_uni',
				'id'
			)

			var where = _.pick(holding, ['symbol_exchange', 'symbol_ticker'])

			return holdings_upsert(_.extend({}, where_clause, where), holding)
		}))
		.then((upserts) =>
		{
			return upserts.length
		})

	}

	return  holdings
}

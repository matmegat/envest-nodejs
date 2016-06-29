var knexed = require('../../../knexed')
var upsert = require('../../../upsert')

var _ = require('lodash')

var validate = require('../../../validate')

var Err = require('../../../../Err')

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
	}

	holdings.set = knexed.transact(knex, (trx, data) =>
	{
		/* operation with validation procedure
		* Expect data to be:
		* {
		*   investor_id: integer,
		*   holdings:
		*   [
		*     {
		*       symbol_exchange: string,
		*       symbol_ticker: string,
		*       buy_price: float,
		*       amount: integer
		*     },
		*     {}
		*   ]
		* }
		* */

		return investor.all.ensure(data.investor_id, trx)
		.then(() =>
		{
			validate.array(data.holdings, 'holdings')

			data.holdings.forEach((holding, i) =>
			{
				validate.required(
					holding.symbol_exchange,
					`holdings[${i}].symbol_exchange`
				)
				validate.empty(
					holding.symbol_exchange,
					`holdings[${i}].symbol_exchange`
				)

				validate.required(
					holding.symbol_ticker,
					`holdings[${i}].symbol_ticker`
				)
				validate.empty(
					holding.symbol_ticker,
					`holdings[${i}].symbol_ticker`
				)

				validate.number(
					holding.amount,
					`holdings[${i}].amount`
				)
				if (holding.amount <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].amount` })
				}

				validate.number(
					holding.buy_price,
					`holdings[${i}].buy_price`
				)
				if (holding.buy_price <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].buy_price` })
				}
			})

			return set_holdings(trx, data)
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')

	return  holdings
}

var knexed = require('../../../knexed')
var upsert = require('../../../upsert')

var _ = require('lodash')

var validate = require('../../../validate')

var Err = require('../../../../Err')

module.exports = function Holdings (db, investor)
{
	var holdings = {}

	var knex    = db.knex

	holdings.table = knexed(knex, 'portfolio_symbols')

	function set_holdings (trx, investor_id, holding_entries)
	{
		/* Expect data to be =
		* investor_id: integer
		* holdings:
		* [
		*   {
		*     symbol_exchange: string,
		*     symbol_ticker:   string,
		*     amount:          integer,
		*     buy_price:       float
		*   },
		*   {},
		* ]
		* */
		var holdings_upsert = upsert(
			holdings.table(trx),
			'portfolio_symbol_unique',
			'id'
		)

		var where_clause = { investor_id: investor_id }

		return Promise.all(_.map(holding_entries, (holding) =>
		{
			var where = _.pick(holding, ['symbol_exchange', 'symbol_ticker'])

			return holdings_upsert(_.extend({}, where_clause, where), holding)
		}))
	}

	holdings.set = knexed.transact(knex, (trx, investor_id, holding_entries) =>
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

		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			validate.array(holding_entries, 'holdings')

			holding_entries.forEach((holding, i) =>
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

			// return set_holdings(trx, investor_id, holdings)
			return Promise.all(_.map(holding_entries, (holding) =>
			{
				return db.xign.resolve(`${holding.symbol_ticker}.${holding.symbol_exchange}`)
			}))
		})
		.catch((error) =>
		{
			throw UnresolvedSymbol({ data: error.Message })
		})
		.then((processed_symbols) =>
		{
			return set_holdings(trx, investor_id, holding_entries)
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')
	var UnresolvedSymbol = Err('invalid_portfolio_symbol',
		`Symbol can't be resolved`)

	holdings.byInvestorId = function (investor_id)
	{
		return holdings.table()
		.where('investor_id', investor_id)
		.debug(true)
	}

	return holdings
}

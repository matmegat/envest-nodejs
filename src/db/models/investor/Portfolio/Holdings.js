
var knexed = require('../../../knexed')
var upsert = require('../../../upsert')

var _ = require('lodash')

var validate = require('../../../validate')

var Err = require('../../../../Err')

module.exports = function Holdings (db, investor)
{
	var holdings = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe
	var one = db.helpers.one

	holdings.table = knexed(knex, 'portfolio_symbols')

	function set_holdings (trx, investor_id, holding_entries)
	{
		/* Expect holding_entries to be =
		* [
		*   {
		*     symbol:    string,
		*     amount:    integer,
		*     buy_price: float
		*   },
		*
		*   {},
		* ]
		* */
		var holdings_upsert = upsert(
			holdings.table(trx),
			'id'
		)

		var where_clause = { investor_id: investor_id }

		return Promise.all(_.map(holding_entries, (holding) =>
		{
			var data = _.pick(holding, 'symbol_exchange', 'symbol_ticker')

			return holdings_upsert(_.extend({}, where_clause, data), holding)
		}))
	}

	holdings.set = knexed.transact(knex, (trx, investor_id, holding_entries) =>
	{
		/* operation with validation procedure
		* Expect holding_entries to be:
		* [
		*   {
		*     symbol_exchange: string,
		*     symbol_ticker: string,
		*     buy_price: float,
		*     amount: integer
		*   },
		*
		*   {}
		* ]
		* */
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			validate.array(holding_entries, 'holdings')

			holding_entries.forEach((holding, i) =>
			{
				validate.required(holding.symbol, `holdings[${i}].symbol`)
				validate.empty(holding.symbol, `holdings[${i}].symbol`)

				validate.number(holding.amount, `holdings[${i}].amount`)
				if (holding.amount <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].amount` })
				}

				validate.number(holding.buy_price, `holdings[${i}].buy_price`)
				if (holding.buy_price <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].buy_price` })
				}
			})

			return Promise.all(_.map(holding_entries, (holding) =>
			{
				return db.symbols.resolve(holding.symbol)
			}))
		})
		.then((processed_symbols) =>
		{
			processed_symbols.forEach((symbol, i) =>
			{
				holding_entries[i].symbol_exchange = symbol.exchange
				holding_entries[i].symbol_ticker   = symbol.ticker
				delete holding_entries[i].symbol
			})

			return set_holdings(trx, investor_id, holding_entries)
		})
	})

	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')

	holdings.byInvestorId = function (investor_id)
	{
		return holdings.table()
		.where('investor_id', investor_id)
	}

	holdings.removeSymbol = function (trx, investor_id, symbol)
	{
		return holdings.table(trx)
		.where({
			investor_id: investor_id,
			symbol_exchange: symbol.symbol_exchange,
			symbol_ticker: symbol.symbol_ticker
		})
		.del()
	}

	holdings.getSymbol = function (investor_id, symbol)
	{
		return holdings.table()
		.where({
			investor_id: investor_id,
			symbol_exchange: symbol.symbol_exchange,
			symbol_ticker: symbol.symbol_ticker
		})
		.then(oneMaybe)
	}

	holdings.addSymbol = function (trx, investor_id, symbol)
	{
		/* @todo: Check if symbol valid */

		return holdings.table(trx)
		.insert(
		{
			investor_id: investor_id,
			symbol_exchange: symbol.symbol_exchange,
			symbol_ticker: symbol.symbol_ticker,
			amount: symbol.amount,
			buy_price: symbol.price
		})
	}

	holdings.buySymbols = function (trx, investor_id, symbol, amount, price)
	{
		return holdings.table(trx)
		.where(
		{
			investor_id: investor_id,
			symbol_exchange: symbol.symbol_exchange,
			symbol_ticker: symbol.symbol_ticker
		})
		.update(
		{
			amount: symbol.amount + amount,
			buy_price: calculate_buy_price(symbol.amount, symbol.buy_price, amount, price)
		})
	}

	holdings.sellSymbols = function (trx, investor_id, symbol, amount, price)
	{
		return holdings.table(trx)
		.where(
		{	
			investor_id: investor_id,
			symbol_exchange: symbol.symbol_exchange,
			symbol_ticker: symbol.symbol_ticker
		})
		.update(
		{
			amount: symbol.amount - amount,
		}, 'amount')
		.then(one)
		.then(amount =>
		{
			if (amount === 0)
			{
				return holdings.removeSymbol(trx, investor_id, symbol)
			}
		})
		.then(() =>
		{
			return amount * price
		})
	}

	var SymbolNotFound = Err('symbol_not_found', 'Symbol Not Found')
	var NotEnoughtAmount = Err('not_enought_amount_to_sell',
		'Not Enought Amount To Sell')
	var NotEnoughtMoney = Err('not_enought_money_to_buy',
		'Not Enought Money To Buy')

	holdings.buy = function (trx, investor_id, symbol, data, cash)
	{
		var amount = data.amount
		var price = data.price
		var sum = amount * price

		if (sum > cash)
		{
			throw NotEnoughtMoney()
		}

		return holdings.getSymbol(investor_id, symbol)
		.then(symbl =>
		{
			if (! symbl)
			{
				symbl = symbol
				symbl.amount = amount
				symbl.price = price

				return holdings.addSymbol(trx, investor_id, symbl)
			}
			
			return holdings.buySymbols(trx, investor_id, symbl, amount, price)
		})
		.then(() =>
		{
			return -sum
		})
	}

	holdings.sell = function (trx, investor_id, symbol, data, cash)
	{
		var amount = data.amount
		var price = data.price

		return holdings.getSymbol(investor_id, symbol)
		.then(symbl =>
		{
			if (! symbol)
			{
				throw SymbolNotFound({ symbol: symbol })
			}

			return symbl
		})
		.then(symbl =>
		{
			if (symbl.amount < amount)
			{
				throw NotEnoughtAmount(
				{
					available_amount: symbl.amount,
					sell_amount: amount
				})
			}

			return holdings.sellSymbols(trx, investor_id, symbl, amount, price)
		})
	}

	function calculate_buy_price (amount_old, price_old, amount, price)
	{
		return (amount_old * price_old + amount * price) / (amount_old + amount)
	}

	return holdings
}

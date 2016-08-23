
var noop = require('lodash/noop')
var map  = require('lodash/map')
var pick = require('lodash/pick')

var expect = require('chai').expect

var knexed = require('../../../knexed')

var validate = require('../../../validate')
var Err = require('../../../../Err')

var Symbl = require('../../symbols/Symbl')

module.exports = function Holdings (db, investor, portfolio)
{
	var holdings = {}

	var knex = db.knex
	var table = knexed(knex, 'portfolio')

	var oneMaybe = db.helpers.oneMaybe


	// byId
	holdings.byId = knexed.transact(knex, (trx, investor_id, for_date) =>
	{
		return byId(trx, investor_id, for_date)
	})

	holdings.symbolById = knexed.transact(knex,
	(trx, symbol, investor_id, for_date) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return byId(trx, investor_id, for_date, function ()
			{
				this.where(symbol.toDb())
			})
		})
		.then(oneMaybe)
	})


	var NoSuchHolding = Err('no_such_holding',
		'Investor does not posess such holding')

	holdings.ensure = knexed.transact(knex, (trx, symbol, investor_id) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return holdings.symbolById(trx, symbol, investor_id)
		})
		.then(so =>
		{
			if (! so)
			{
				throw NoSuchHolding({ symbol: symbol })
			}

			return so
		})
	})


	function byId (trx, investor_id, for_date, aux)
	{
		var raw = knex.raw

		aux || (aux = noop)

		return knex(raw('portfolio AS P'))
		.transacting(trx)
		.select('symbol_ticker', 'symbol_exchange', 'amount', 'price')
		.where('investor_id', investor_id)
		.where('amount', '>', 0)
		.where('timestamp',
			table().max('timestamp')
			.where(
			{
				investor_id:     raw('P.investor_id'),
				symbol_exchange: raw('P.symbol_exchange'),
				symbol_ticker:   raw('P.symbol_ticker'),
			})
			.where(function ()
			{
				if (for_date)
				{
					this.where('timestamp', '<=', for_date)
				}
			})
		)
		.where(aux)
		.then(r =>
		{
			r.forEach(it =>
			{
				it.price = Number(it.price)
			})

			return r
		})
	}

	// holdings.byId(120, new Date('2016-08-09 09:17:03.636867-03'))
	// holdings.byId(120)
	// .then(console.info, console.error)

	// holdings.symbolById('GE.XNYS', 120, new Date('2016-08-09 10:19:19.982-03'))
	// holdings.symbolById('GE.XNYS', 120)
	// holdings.symbolById('TSLA.XNAS', 120)
	// .then(console.info.part('symbol'), console.error.part('symbol'))


	// set
	var InvalidAmount = Err('invalid_portfolio_amount',
		'Invalid amount value for cash, share, price')

	holdings.set = knexed.transact(knex, (trx, investor_id, holding_entries) =>
	{
		return investor.all.ensure(investor_id, trx)
		.then(() =>
		{
			validate.array(holding_entries, 'holdings')

			holding_entries.forEach((holding, i) =>
			{
				validate.required(holding.symbol, `holdings[${i}].symbol`)
				validate.empty(holding.symbol, `holdings[${i}].symbol`)

				validate.number(holding.amount, `holdings[${i}].amount`)
				if (holding.amount < 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].amount` })
				}

				validate.number(holding.price, `holdings[${i}].price`)
				if (holding.price <= 0)
				{
					throw InvalidAmount({ field: `holdings[${i}].price` })
				}
			})

			return db.symbols.resolveMany(map(holding_entries, 'symbol'))
		})
		.then(symbols =>
		{
			return Promise.all(symbols.map((symbol, i) =>
			{
				var holding = holding_entries[i]
				var data = pick(holding, 'amount', 'price')

				return put(trx, investor_id, symbol, data)
			}))
		})
		.then(() =>
		{
			return portfolio.recalculate(trx, investor_id)
		})
	})


	function put (trx, investor_id, symbol, data)
	{
		expect(symbol).ok
		expect(symbol.exchange).a('string')
		expect(symbol.ticker).a('string')

		expect(data).ok
		expect(data.amount).a('number')
		expect(data.price).a('number')

		return table(trx)
		.insert({
			investor_id: investor_id,

			symbol_exchange: symbol.exchange,
			symbol_ticker: symbol.ticker,

			// timestamp NOW() TODO backpost

			amount: data.amount,
			price:  data.price
		})
	}


	// buy, sell
	var validate_positive = validate.number.positive

	var NotEnoughMoney = Err('not_enough_money_to_buy',
		'Not Enough Money To Buy')

	holdings.buy = function (trx, investor_id, symbol, data, cash)
	{
		validate_positive(data.amount, 'amount')
		validate_positive(data.price, 'price')

		var amount = data.amount
		var price  = data.price
		var sum    = amount * price

		if (sum > cash)
		{
			throw NotEnoughMoney()
		}

		return holdings.symbolById(symbol, investor_id)
		.then(holding =>
		{
			if (holding)
			{
				amount = holding.amount + amount
			}

			var data_put =
			{
				amount: amount,
				price:  price
			}

			return put(trx, investor_id, symbol, data_put)
		})
		.then(() =>
		{
			return -sum
		})
	}


	var NotEnoughAmount = Err('not_enough_amount_to_sell',
		'Not Enough Amount To Sell')

	holdings.sell = function (trx, investor_id, symbol, data)
	{
		validate_positive(data.amount, 'amount')
		validate_positive(data.price, 'price')

		var amount = data.amount
		var price  = data.price
		var sum    = amount * price

		return holdings.ensure(trx, symbol, investor_id)
		.then(holding =>
		{
			if (holding.amount < amount)
			{
				throw NotEnoughAmount(
				{
					available_amount: holding.amount,
					sell_amount: amount
				})
			}

			amount = amount - holding.amount

			var data_put =
			{
				amount: amount,
				price:  price
			}

			return put(trx, investor_id, symbol, data_put)
		})
		.then(() =>
		{
			return sum
		})
	}

	return holdings
}


var assign = Object.assign

var wrap = require('lodash/wrap')

var moment = require('moment')

var Op = require('./Op')
var validate = require('../../../../validate')
var Err = require('../../../../../Err')

module.exports = function RemoveHoldingOp (investor_id, timestamp, holdings)
{
	var op = Op(investor_id, timestamp)

	var NoSuchHolding = Err('no_such_holding',
		'Investor does not posess such holding')

	validate.array(holdings, 'holdings')

	holdings.forEach((holding, i) =>
	{
		validate.required(holding.symbol, `holdings[${i}].symbol`)
		validate.empty(holding.symbol, `holdings[${i}].symbol`)
	})

	op.type = 'remove-holdings'

	op.holdings = holdings


	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type: op.type,
			data: JSON.stringify(op.holdings)
		})
	})

	op.apply = (trx, portfolio, db) =>
	{
		return Promise.all(op.holdings.map((holding) =>
		{
			return db.feed.ensureNotTraded(trx, investor_id, holding)
			.then(() =>
			{
				return portfolio.holdings.symbolById(trx,
					holding.symbol,
					investor_id,
					null,
					{ with_timestamp: true }
				)
			})
			.then(holding_pk =>
			{
				if (! holding_pk)
				{
					throw NoSuchHolding()
				}

				var timestamp = moment(holding_pk.timestamp)

				return portfolio.holdings.remove(trx, holding_pk)
				.then(() =>
				{
					portfolio.brokerage.remove(
						trx, op.investor_id, timestamp
					)
				})
			})
		}))
	}

	op.undone = (trx, portfolio) =>
	{
		op.holdings.forEach((holding) =>
		{
			return holdings.symbolById(trx, holding, investor_id,
				null, { with_timestamp: true }
			)
			.then(holding_pk =>
			{
				if (! holding_pk)
				{
					throw NoSuchHolding()
				}

				holding.timestamp = holding_pk.timestamp
			})
		})
		return portfolio.holdings.set(trx, op.investor_id, op.holdings)
	}

	op.resolve = (symbols) =>
	{
		return symbols
		.resolveMany(op.holdings.map(h => h.symbol), { other: true })
		.then(resolved_symbols =>
		{
			op.holdings.forEach((holding, i) =>
			{
				holding.symbol = resolved_symbols[i].full
			})
		})
	}

	op.inspect = () =>
	{
		var substitution = []

		op.holdings.forEach((holding) =>
		{
			substitution.push(`${holding.symbol.inspect()}` +
			` ${holding.amount} shares per ${holding.price}$`)
		})

		return `REMOVE HOLDINGS {${op.investor_id}} (${op.timestamp.format()})` +
		` ${substitution.join(', ')}`
	}


	return op
}

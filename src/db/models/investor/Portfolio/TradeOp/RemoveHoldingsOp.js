
var assign = Object.assign

var extend = require('lodash/extend')
var wrap = require('lodash/wrap')

var Op = require('./Op')
var validate = require('../../../../validate')

module.exports = function RemoveHoldingOp (investor_id, timestamp, holdings)
{
	var op = Op(investor_id, timestamp)

	validate.array(holdings, 'holdings')

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

	op.apply = (trx, portfolio) =>
	{
		return Promise.all(op.holdings.map((holding) =>
		{
			return portfolio.symbols.ensureNotTraded(trx, investor_id, holding)
			.then(() =>
			{
				return portfolio.holdings
				.remove(trx, extend({}, holding.symbol.toDb(),
				{
					investor_id: op.investor_id,
					timestamp: op.timestamp.toDate()
				}))
			})
		}))
		.then(() => portfolio.brokerage.remove(trx, op.investor_id, op.timestamp))
	}

	op.undone = (trx, portfolio) =>
	{
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
				holding.symbol = resolved_symbols[i]
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

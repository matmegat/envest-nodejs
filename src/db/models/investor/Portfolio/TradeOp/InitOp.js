/**
 * Purpose:
 * - create brokerage
 * - create holdings
 */

var assign = Object.assign

var expect = require('chai').expect
var extend = require('lodash/extend')
var omit   = require('lodash/omit')
var wrap   = require('lodash/wrap')

var Op    = require('./Op')
var Symbl = require('../../../symbols/Symbl')

module.exports = function NonTradeOp (investor_id, timestamp, op_data)
{
	var init_operations =
	[
		'brokerage',
		'holdings',
	]

	var op = Op(investor_id, timestamp)

	expect(op_data).to.be.an('object')
	expect(op_data).property('type')
	expect(init_operations).include(op_data.type)

	expect(op_data).property('value')


	op.type = 'init'

	op.init_data = {}
	op.init_data.type = op_data.type
	op.init_data.holdings = []

	if (op_data.type === 'brokerage')
	{
		expect(op_data.value).to.be.a('number')
		op.init_data.value = op_data.value
	}

	function vrow (holding)
	{
		expect(holding.symbol).ok
		expect(holding.amount).to.be.a('number')
		expect(holding.price).to.be.a('number')

		holding.symbol = Symbl(holding.symbol)
		holding.date = op.timestamp
	}

	if (op_data.type === 'holdings')
	{
		expect(op_data.value).to.be.an('array')
		op_data.value.forEach(vrow)

		op.init_data.holdings = op.init_data.value = op_data.value
	}

	function apply_brokerage (trx, portfolio)
	{
		return portfolio.brokerage.put(
			trx,
			op.investor_id,
			op.init_data.value,
			op.timestamp,
			null,
			{ recalculate: true }
		)
	}

	function apply_holdings (trx, portfolio)
	{
		return portfolio.holdings.set(trx, op.investor_id, op.init_data.holdings)
	}

	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type: op.type,
			data: omit(op.init_data, 'holdings')
		})
	})

	op.apply = (trx, portfolio) =>
	{
		if (op.init_data.type === 'brokerage')
		{
			return apply_brokerage(trx, portfolio)
		}

		if (op.init_data.type === 'holdings')
		{
			return apply_holdings(trx, portfolio)
		}
	}

	op.undone = (trx, portfolio) =>
	{
		return Promise.all(op.init_data.holdings.map((holding) =>
		{
			return portfolio.holdings
			.remove(trx, extend({}, op.toPK(), holding.symbol.toDb()))
		}))
		.then(() => portfolio.brokerage.remove(trx, op.investor_id, op.timestamp))
	}

	op.equals = (other) =>
	{
		/* equals work only for brokerage */
		var dL = op.init_data
		var dR = other.init_data

		if (dL.type !== dR.type) { return false }

		return dL.type === 'brokerage'
	}

	op.inspect = () =>
	{
		var id = op.init_data
		var substitution = ''

		if (id.type === 'brokerage')
		{
			substitution = `${id.value}`
		}
		if (id.type === 'holdings')
		{
			id.holdings.forEach((holding) =>
			{
				substitution += `${holding.symbol.inspect()}` +
				` ${holding.amount} shares per ${holding.price}$`
			})
		}

		return `INITOP {${op.investor_id}} (${op.timestamp.format()})` +
		` ${id.type} ${substitution}`
	}


	return op
}

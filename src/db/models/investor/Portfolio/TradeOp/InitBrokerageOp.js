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

var Op       = require('./Op')
var validate = require('../../../../validate')

module.exports = function NonTradeOp (investor_id, timestamp, brokerage)
{
	var op = Op(investor_id, timestamp)

	validate.required(brokerage, 'brokerage')

	validate.required(brokerage.amount, 'brokerage.amount')
	validate.number(brokerage.amount, 'brokerage.amount')

	op.type = 'init-brokerage'

	op.brokerage = brokerage


	op.toDb = wrap(op.toDb, toDb =>
	{
		return assign(toDb(),
		{
			type: op.type,
			data: op.brokerage,
		})
	})

	op.apply = (trx, portfolio) =>
	{
		return portfolio.brokerage.put(
			trx,
			op.investor_id,
			op.brokerage.amount,
			op.timestamp,
			null,
			{ recalculate: true }
		)
	}

	op.undone = (trx, portfolio) =>
	{
		return portfolio.brokerage
		.remove(trx, op.investor_id, op.timestamp)
	}

	// eslint-disable-next-line no-unused-vars
	op.equals = (other) =>
	{
		/* all other types, already matched:
		 * - type: 'init-brokerage'
		 * - investor_id
		 * - timestamp
		 * */
		return true
	}

	op.inspect = () =>
	{
		return `INIT BROKERAGE {${op.investor_id}} (${op.timestamp.format()})` +
		` ${op.brokerage.amount}`
	}


	return op
}

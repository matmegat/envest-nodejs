

var expect = require('chai').expect

var invoke = require('lodash/invokeMap')

var knexed = require('../../../knexed')
var Err = require('../../../../Err')

var Op = require('./TradeOp/Op')
var pickOp = require('./TradeOp/pick-Op')


module.exports = function Tradeops (db, portfolio)
{
	var knex = db.knex

	var table = knexed(knex, 'tradeops')

	var one = db.helpers.one
	var oneMaybe = db.helpers.oneMaybe

	var tradeops = {}

	expect(portfolio, 'Tradeops depends on Holdings').property('holdings')
	var holdings  = portfolio.holdings

	expect(portfolio, 'Tradeops depends on Brokerage').property('brokerage')
	var brokerage = portfolio.brokerage


	// store
	tradeops.replay = (trx, ops) =>
	{
		ops = invoke(ops, 'toDb')

		return table(trx).insert(ops)
		.catch(Err.fromDb('timed_tradeop_unique', DuplicateEntry))
	}

	var DuplicateEntry = Err('tradeop_duplicate',
		'There can be only one trading operation per timestamp for Investor')


	// restore
	tradeops.sequence = (trx, tradeop) =>
	{
		return sequential(trx, tradeop)
		.then(rows => rows.map(load))
	}

	function load (row)
	{
		var C = pickOp(row.type)

		return C(row.investor_id, row.timestamp, row.data)
	}


	function sequential (trx, tradeop)
	{
		expect(Op.is(tradeop), 'Op type').true

		return table(trx)
		.where('timestamp', '>=', tradeop.timestamp)
	}


	// undone
	tradeops.undone = (trx, tradeop) =>
	{
		return sequential(trx, tradeop)
		.delete()
	}

	/*function byId (investor_id, timestamp)
	{
		expect(investor_id).a('number')
		expect(timestamp).a('date')

		return table()
		.where('investor_id', investor_id)
		.where('timestamp', timestamp)
	}*/


	return tradeops
}

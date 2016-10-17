

var expect = require('chai').expect

var invoke = require('lodash/invokeMap')

var PReduce = require('bluebird').reduce

var knexed = require('../../../knexed')
var Err = require('../../../../Err')

var Op = require('./TradeOp/Op')
var pickOp = require('./TradeOp/pick-Op')


module.exports = function Tradeops (db, portfolio)
{
	var knex = db.knex

	var table = knexed(knex, 'tradeops')

	var tradeops = {}


	tradeops.apply = (trx, tradeop) =>
	{
		return tradeops.sequence(trx, tradeop)
		.then(ops =>
		{
			return PReduce(ops, (memo, current) =>
			{
				return current.undone(trx, portfolio)
			})
			.then(() =>
			{
				return tradeops.flush(trx, tradeop)
			})
			.then(() => ops)
		})
		.then(ops =>
		{
			// +tradeop

			return PReduce(ops, (memo, current) =>
			{
				return current.apply(trx, portfolio)
			})
			.then(() => ops)
		})
		.then(ops =>
		{
			return tradeops.replay(trx, ops)
		})
	}


	tradeops.replay = (trx, ops) =>
	{
		ops = invoke(ops, 'toDb')

		return table(trx).insert(ops)
		.then(() => ops)
		.catch(Err.fromDb('timed_tradeop_unique', DuplicateEntry))
	}

	var DuplicateEntry = Err('tradeop_duplicate',
		'There can be only one trading operation per timestamp for Investor')


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


	tradeops.flush = (trx, tradeop) =>
	{
		return sequential(trx, tradeop)
		.delete()
	}


	function sequential (trx, tradeop)
	{
		expect(Op.is(tradeop), 'Op type').true

		return table(trx)
		.where('timestamp', '>=', tradeop.timestamp)
	}


	return tradeops
}

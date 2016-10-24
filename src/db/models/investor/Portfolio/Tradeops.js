

var expect = require('chai').expect

var invoke = require('lodash/invokeMap')
var find   = require('lodash/findIndex')

var PReduce = require('bluebird').reduce

var knexed = require('../../../knexed')
var Err = require('../../../../Err')

var Op = require('./TradeOp/Op')
var pickOp = require('./TradeOp/pick-Op')
var DeleteOp = require('./TradeOp/DeleteOp')

module.exports = function Tradeops (db, portfolio)
{
	var knex = db.knex

	var table = knexed(knex, 'tradeops')

	var tradeops = {}

	expect(portfolio, 'Tradeops depends on resolving').property('symbols')
	var symbols = portfolio.symbols


	tradeops.apply = (trx, tradeop) =>
	{
		return tradeops.sequence(trx, tradeop)
		.then(ops =>
		{
			ops = merge.undone(tradeop, ops)

			return PReduce(ops, (memo, current) =>
			{
				return current.undone(trx, portfolio)
			}
			, null)
			.then(() =>
			{
				return tradeops.flush(trx, tradeop)
			})
			.then(() => ops)
		})
		.then(ops =>
		{
			return tradeop.resolve(symbols)
			.then(() => ops)
		})
		.then(ops =>
		{
			ops = merge.apply(tradeop, ops)

			return PReduce(ops, (memo, current) =>
			{
				return current.apply(trx, portfolio, db)
			}
			, null)
			.then(() => ops)
		})
		.then(ops =>
		{
			return tradeops.replay(trx, ops)
			.then(() => ops)
		})
	}

	function op_adjust (trade_op, ops)
	{
		if (! ops.length)
		{
			return trade_op
		}

		ops.forEach(op =>
		{
			if (Op.sameTime(trade_op, op))
			{
				moveForward(trade_op)
			}
		})

		return trade_op

		function moveForward (tradeop)
		{
			tradeop.timestamp.add(1, 'm')
		}
	}

	var merge = {}
	merge.undone = function op_undone (trade_op, ops)
	{
		if (DeleteOp.is(trade_op))
		{
			/* apply delete action */
			var tradeop = trade_op.unwrap()

			if (ops.length && Op.equals(tradeop, ops[0]))
			{
				return ops
			}
			else
			{
				throw new TypeError('attempt_to_remove_nonexistent_op')
			}
		}
		else
		{
			if (ops.length && Op.equals(trade_op, ops[0]))
			{
				/* first element equals -- undone it */
				return ops
			}
			else
			{
				/* undone Ops only earlier than tradeop */
				trade_op = op_adjust(trade_op, ops)

				return ops.filter(op => op.timestamp.isAfter(trade_op.timestamp))
			}
		}
	}

	merge.apply = function op_apply (trade_op, ops)
	{
		if (DeleteOp.is(trade_op))
		{
			/* apply delete action */
			var tradeop = trade_op.unwrap()

			if (ops.length && Op.equals(tradeop, ops[0]))
			{
				return ops.slice(1)
			}
			else
			{
				throw new TypeError('attempt_to_remove_nonexistent_op')
			}
		}
		else
		{
			if (ops.length && Op.equals(trade_op, ops[0]))
			{
				/* first element equals -- modify it */
				ops = ops.slice(1)
			}
			else
			{
				trade_op = op_adjust(trade_op, ops)
			}

			return [ trade_op ].concat(ops.filter(op =>
			{
				return op.timestamp.isAfter(trade_op.timestamp)
			}))
		}
	}


	tradeops.replay = (trx, ops) =>
	{
		ops = invoke(ops, 'toDb')

		return table(trx).insert(ops)
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
		.where('investor_id', tradeop.investor_id)
		.where('timestamp', '>=', tradeop.timestamp.format())
	}


	return tradeops
}

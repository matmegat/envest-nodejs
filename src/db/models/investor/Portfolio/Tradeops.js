

var expect = require('chai').expect

var invoke = require('lodash/invokeMap')

var PReduce = require('bluebird').reduce

var knexed = require('../../../knexed')
var Err = require('../../../../Err')

var Op = require('./TradeOp/Op')
var pickOp = require('./TradeOp/pick-Op')
var DeleteOp = require('./TradeOp/DeleteOp')

var ChunkedPaginator = require('../../../paginator/Chunked')
var Filter = require('../../../Filter')
var validate = require('../../../validate')

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
			ops = op_merge(tradeop, ops)

			return PReduce(ops, (memo, current) =>
			{
				return current.apply(trx, portfolio)
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

	function op_merge (tradeop, ops)
	{
		if (DeleteOp.is(tradeop))
		{
			/* apply delete action */
			var tradeop = tradeop.unwrap()

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
			if (ops.length && Op.equals(tradeop, ops[0]))
			{
				/* first element equals -- modify it */
				ops = ops.slice(1)
			}

			return [ tradeop ].concat(ops)
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
		.where('timestamp', '>=', tradeop.timestamp)
	}

	var filter = Filter(
	{
		type: Filter.by.field('type', validate.collection(
		[
			'trade',
			'nontrade',
		]))
	})

	var paginator_chunked = ChunkedPaginator(
	{
		table: table,
		order_column: 'timestamp',
		real_order_column: 'timestamp',
		default_direction: 'desc',
	})

	tradeops.byInvestorId = (trx, investor_id, options) =>
	{
		expect(investor_id).to.be.a('number')

		var queryset = table(trx)
		.where('investor_id', investor_id)

		queryset = filter(queryset, options.filter)

		var count_queryset = queryset.clone()

		return paginator_chunked.paginate(queryset, options.paginator)
		.then(rows => rows.map(load))
		.then(operations =>
		{
			return db.helpers.count(count_queryset)
			.then(count =>
			{
				return {
					operations: operations,
					total: count
				}
			})
		})
	}

	tradeops.byId = (trx, investor_id, timestamp) =>
	{
		expect(investor_id).to.be.a('number')
		expect(timestamp).to.be.a('date')

		return table(trx)
		.where('investor_id', investor_id)
		.where('timestamp', timestamp)
		.then(db.helpers.one)
		.then(load)
	}


	return tradeops
}

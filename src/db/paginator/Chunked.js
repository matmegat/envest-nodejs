
var extend = require('lodash/extend')

var expect = require('chai').expect

var toId = require('../../id').toId

var one = require('../helpers').one

var defaults =
{
	order_column: 'id',
	real_order_column: 'timestamp',
	table: null,
	limit: 20
}

module.exports = function Paginator__Chunked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	expect(paginator_options.table, 'paginator target relation').a('function')

	var table = paginator_options.table

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		var current_id = (options.since_id || options.max_id)

		expect(current_id).ok()

		return get_current_chunk(current_id)
		.then(chunk =>
		{
			var order_column = options.order_column
			var limit = options.limit

			limit = Math.min(limit, defaults.limit)

			/* ... */
		})
	}

	function get_current_chunk (id)
	{
		return table()
		.where(paginator_options.order_column, id)
		.then(one)
	}

	return paginator
}

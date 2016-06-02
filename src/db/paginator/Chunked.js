
var extend = require('lodash/extend')
var values = require('lodash/values')

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

		var max_id   = toId(options.max_id)
		var since_id = toId(options.since_id)

		// expect(since_id && max_id).not.ok

		var current_id = (since_id || max_id)
		// expect(current_id).ok

		return get_current_chunk(current_id)
		.then(current_chunk =>
		{
			var order_column = options.order_column
			var real_order_column = options.real_order_column
			var limit = options.limit

			limit = Math.min(limit, defaults.limit)

			queryset
			.where(function ()
			{
				var sign = order_sign(since_id, max_id)

				if (current_chunk)
				{
					this.where(real_order_column, values(current_chunk)[0])
					this.where(order_column, sign, current_id)
				}
				/* FEED
				* real_order_column = 'timestamp'
				* order_column = 'id'
				* default_direction = 'desc'
				* */
			})
			.orWhere(function ()
			{
				var sign = real_order_sign(since_id, max_id)

				if (current_chunk)
				{
					this.where(real_order_column, sign, values(current_chunk)[0])
				}
			})

			var dir = sorting(since_id, max_id)

			queryset
			.orderBy(real_order_column, dir)
			.orderBy(order_column, dir)

			return queryset.limit(limit)
		})
	}

	function get_current_chunk (id)
	{
		if (! id)
		{
			return Promise.resolve(null)
		}
		else
		{
			return table()
			.select(paginator_options.real_order_column)
			.where(paginator_options.order_column, id)
			.then(one)
		}
	}

	function order_sign (since_id, max_id)
	{
		if (since_id)
		{
			return '>'
		}
		else
		{
			return '<='
		}
	}

	function real_order_sign (since_id, max_id)
	{
		if (since_id)
		{
			return '>'
		}
		else
		{
			return '<'
		}
	}

	function sorting (since_id, max_id)
	{
		if (since_id)
		{
			return 'asc'
		}
		else
		{
			return 'desc'
		}
	}

	return paginator
}

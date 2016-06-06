
var extend = require('lodash/extend')
var get = require('lodash/fp/get')

var expect = require('chai').expect

var toId = require('../../id').toId

var one = require('../helpers').one

var defaults =
{
	order_column: 'id',
	real_order_column: 'timestamp',
	default_direction: 'desc',
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
		var default_dir = options.default_direction

		var current_id = (since_id || max_id)

		var order_column = options.order_column
		var real_order_column = options.real_order_column

		return get_current_chunk(current_id, real_order_column)
		.then(current_chunk =>
		{
			var limit = options.limit

			limit = Math.min(limit, defaults.limit)

			queryset
			.where(function ()
			{
				var sign = order_sign(default_dir, since_id, max_id)

				if (current_chunk)
				{
					this.where(real_order_column, current_chunk)
					this.where(order_column, sign, current_id)
				}
			})
			.orWhere(function ()
			{
				var sign = real_order_sign(default_dir, since_id, max_id)

				if (current_chunk)
				{
					this.where(real_order_column, sign, current_chunk)
				}
			})

			var dir = sorting(default_dir, since_id, max_id)

			queryset
			.orderBy(real_order_column, dir)
			.orderBy(order_column, dir)

			return queryset.limit(limit)
		})
	}

	function get_current_chunk (id, column)
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
			.then(get(column))
		}
	}

	function order_sign (direction, since_id)
	{
		var sign = '<='

		if (direction === 'asc')
		{
			sign = '>='
		}

		if (since_id)
		{
			sign = invert(sign)
		}

		return sign
	}

	function real_order_sign (direction, since_id)
	{
		var sign = '<'

		if (direction === 'asc')
		{
			sign = '>'
		}

		if (since_id)
		{
			sign = invert(sign)
		}

		return sign
	}

	function sorting (direction, since_id)
	{
		if (since_id)
		{
			return invert(direction)
		}

		return direction
	}

	function invert (order_or_sign)
	{
		switch (order_or_sign)
		{
			case 'asc' : return 'desc'
			case 'desc': return 'asc'
			case '>'   :
			case '>='  : return '<'
			case '<'   :
			case '<='  : return '>'
			default: throw Error('Invalid argument')
		}
	}

	return paginator
}

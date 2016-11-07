
var extend = require('lodash/extend')
var includes = require('lodash/includes')
var find = require('lodash/find')

var Err = require('../Err')

var defaults =
{
	order_column: 'timestamp',
	default_direction: 'desc'
}

module.exports = function Sorter (sorter_options)
{
	var sorter = {}

	sorter_options = extend({}, defaults, sorter_options)

	// eslint-disable-next-line max-statements
	sorter.sort = function (queryset, options)
	{
		var column
		var direction

		if (options && options.sort)
		{
			var sort = options.sort.split(',')

			column = sort[0]
			direction = sort[1]
		}

		var dir = direction || sorter_options.default_direction
		validate_dir(dir)

		var order_column = column || sorter_options.order_column
		var order = pick_order(order_column, sorter_options.allowed_columns)

		var column = order.column
		var aux = order.aux

		if (aux)
		{
			aux = ' ' + aux
		}
		else
		{
			aux = ''
		}

		dir = ' ' + dir.toUpperCase()

		var order_column_func = sorter_options.order_column_func
		var raw

		if (order_column_func)
		{
			raw = order_column_func + '(' + column + ')' + aux + dir
		}
		else
		{
			raw = column + aux + dir
		}

		queryset.orderByRaw(raw)

		if (sorter_options.fallback_by)
		{
			queryset.orderBy(sorter_options.fallback_by, 'desc')
		}

		return queryset
	}


	var WrongDirection = Err('wrong_direction', 'Direction could be desc or asc')

	function validate_dir (direction)
	{
		if (direction !== 'desc' &&
		direction !== 'asc')
		{
			throw WrongDirection()
		}
	}


	var WrongOrderColumn = Err('wrong_order_column', 'Wrong order column')

	function pick_order (order_column, allowed_columns)
	{
		var simple = includes(allowed_columns, order_column)

		if (simple)
		{
			return { column: order_column, aux: null }
		}

		var ext = find(allowed_columns, { column: order_column })

		if (ext)
		{
			return { column: ext.column, aux: ext.aux }
		}

		throw WrongOrderColumn()
	}

	return sorter
}

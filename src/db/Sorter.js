
var extend = require('lodash/extend')

var _ = require('lodash')

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

	sorter.sort = function (queryset, options)
	{

		var column, direction

		if(options && options.sort)
		{
			var sort = options.sort.split(',')

			column = sort[0]
			direction = sort[1]
		}

		var order_column = column ||
		sorter_options.order_column

		var default_dir  = direction ||
		sorter_options.default_direction

		validate_dir(default_dir)
		validate_order(order_column,
		sorter_options.allowed_columns)

		queryset.orderBy(order_column, default_dir)

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

	function validate_order (order_column, allowed_columns)
	{
		if (! _.includes(allowed_columns, order_column))
		{
			throw WrongOrderColumn()
		}
	}

	return sorter
}

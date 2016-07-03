
var extend = require('lodash/extend')

var Err = require('../Err')
var WrongDirection =
    Err('wrong_direction', 'Direction could be desc or asc')

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
		var order_column = sorter_options.column_alias[options.sort] ||
		sorter_options.order_column

		var default_dir  = options.dir ||
		sorter_options.default_direction

		if (validate_dir(default_dir))
		{
			throw WrongDirection()
		}

		queryset.orderBy(order_column, default_dir)

		return queryset
	}

	function validate_dir (dir)
	{
		return dir !== 'desc' &&
		dir !== 'asc'
	}

	return sorter
}


var extend = require('lodash/extend')

var toId = require('../../id').toId

var defaults = require('./options')

var ordered_defaults =
{
	order_column: 'id'
}

defaults = extend({}, ordered_defaults, defaults)

module.exports = function Paginator__Ordered (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		var order_column = options.order_column

		var max_id   = toId(options.max_id)
		var since_id = toId(options.since_id)

		var limit = options.limit

		limit = Math.min(limit, defaults.limit)

		if (since_id)
		{
			queryset.where(order_column, '>', since_id)
		}
		if (max_id)
		{
			queryset.where(order_column, '<=', max_id)
		}

		if (since_id)
		{
			queryset.orderBy(order_column, 'asc')
		}
		else
		{
			queryset.orderBy(order_column, 'desc')
		}

		queryset.limit(limit)

		return queryset
	}

	return paginator
}

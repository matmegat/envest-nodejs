
var _ = require('lodash')
var extend = _.extend

var toId = require('../toId')

var defaults =
{
	column_name: 'id',
	limit: 20
}

module.exports = function Paginator (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		var column_name = options.column_name
		var max_id = toId(options.max_id)
		var since_id = toId(options.since_id)
		var limit = options.limit

		limit = Math.min(limit, defaults.limit)

		queryset
		.orderBy('timestamp', 'desc')
		.limit(limit)

		if (since_id)
		{
			queryset.where(column_name, '>', since_id)
		}
		if (max_id)
		{
			queryset.where(column_name, '<=', max_id)
		}

		return queryset
	}

	return paginator
}
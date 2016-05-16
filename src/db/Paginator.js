
var _ = require('lodash')

var extend = _.extend

var toId = require('../toId')

module.exports = function Paginator (column_name, paginator_defaults)
{
	var paginator = {}

	paginator.paginate = function (queryset, options)
	{
		var column_name = column_name || 'id'

		options = extend({}, paginator_defaults, options)

		options.max_id   = toId(options.max_id)
		options.since_id = toId(options.since_id)
		options.limit    = options.limit || 20

		queryset
		.orderBy('timestamp', 'desc')
		.limit(options.limit)

		if (options.since_id)
		{
			queryset
			.where('id', '>', options.since_id)
		}
		if (options.max_id)
		{
			queryset
			.where('id', '<=', options.max_id)
		}

		return queryset
	}

	return paginator
}

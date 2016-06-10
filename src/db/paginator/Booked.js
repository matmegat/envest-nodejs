
var extend = require('lodash/extend')

var toId = require('../../id').toId

var defaults =
{
	limit: 20
}

module.exports = function Paginator__Booked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		var limit  = Math.min(options.limit, defaults.limit)
		var offset = toId(options.page) * limit

		queryset.limit(limit)

		if (offset)
		{
			queryset.offset(offset)
		}

		return queryset
	}

	return paginator
}

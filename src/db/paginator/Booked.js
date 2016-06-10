
var extend = require('lodash/extend')

var toId = require('../../id').toId

var defaults = require('./options')

module.exports = function Paginator__Booked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		var limit  = Math.min(options.limit, defaults.limit)
		var offset = (toId(options.page) - 1) * limit //toId ипользуется т.к его логика подходит для проверки page

		queryset.limit(limit)

		if (offset)
		{
			queryset.offset(offset)
		}

		return queryset
	}

	return paginator
}

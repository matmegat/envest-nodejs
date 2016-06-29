
var extend = require('lodash/extend')

var toId = require('../../id').toId

var validateId = require('../../id').validate
var Err = require('../../Err')
var WrongPageNumber = Err('wrong_page_number', 'Wrong Page Number')

var defaults = require('./options')

defaults = extend({}, defaults,
{
	order_column: 'timestamp',
	default_direction: 'desc'
})

module.exports = function Paginator__Booked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		//toId и validateId ипользуются т.к их логика подходит для проверки page
		var page = toId(options.page)
		validateId(WrongPageNumber, page)

		var limit  = Math.min(options.limit, defaults.limit)
		var offset = (page - 1) * limit

		queryset.limit(limit)

		if (offset)
		{
			queryset.offset(offset)
		}

		var order_column = options.order_column
		var default_dir = options.default_direction

		queryset.orderBy(order_column, default_dir)

		return queryset
	}

	paginator.total = function (response, count)
	{
		response.total = count
		response.pages = Math.ceil(count / paginator_options.limit)

		return response
	}

	return paginator
}

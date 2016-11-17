
var extend = require('lodash/extend')
var curry = require('lodash/curry')

var count = require('../../db/helpers').count

var toId = require('../../id').toId

var validateId = require('../../id').validate
var Err = require('../../Err')
var WrongPageNumber = Err('wrong_page_number', 'Wrong Page Number')

var defaults = require('./options')

module.exports = function Paginator__Booked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	paginator.paginate = function (queryset, options)
	{
		options = extend({}, paginator_options, options)

		// toId и validateId ипользуются т.к их логика подходит для проверки page
		var page = toId(options.page)

		if (! page)
		{
			return queryset
		}

		validateId(WrongPageNumber, page)

		var limit  = Math.min(options.limit, defaults.limit)
		var offset = (page - 1) * limit

		queryset.limit(limit)

		if (offset)
		{
			queryset.offset(offset)
		}

		return queryset
	}

	paginator.total = curry((count_queryset, response) =>
	{
		return count(count_queryset)
		.then(total =>
		{
			response.total = total
			response.pages = Math.ceil(total / paginator_options.limit)

			return response
		})
	})

	paginator.total.decorate = curry((name, count_queryset, response) =>
	{
		var response_alt = {}

		response_alt[name] = response

		return paginator.total(count_queryset, response_alt)
	})

	return paginator
}

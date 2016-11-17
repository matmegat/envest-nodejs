
var curry = require('lodash/curry')

var count = require('../../db/helpers').count

module.exports = function (paginator_options)
{
	var total = curry((count_queryset, response) =>
	{
		return count(count_queryset)
		.then(total =>
		{
			response.total = total
			response.pages = Math.ceil(total / paginator_options.limit)

			return response
		})
	})

	total.decorate = curry((name, count_queryset, response) =>
	{
		response = { [name]: response }

		return total(count_queryset, response)
	})

	return total
}

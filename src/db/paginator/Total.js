
var curry = require('lodash/curry')

var count = require('../../db/helpers').count

module.exports = function (paginator_options)
{
	function total_only (response, total)
	{
		response.total = total
		response.pages = Math.ceil(total / paginator_options.limit)

		return response
	}

	var total = curry((count_queryset, response) =>
	{
		return count(count_queryset)
		.then(total =>
		{
			return total_only(response, total)
		})
	})

	total.only = total_only

	total.decorate = curry((name, count_queryset, response) =>
	{
		response = { [name]: response }

		return total(count_queryset, response)
	})

	return total
}

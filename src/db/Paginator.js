
var _ = require('lodash')
var toNumber = _.toNumber
var isInteger    = _.isInteger

module.exports = function Paginator (queryset, options, column_name)
{
	var column_name = column_name || 'id'

	options.max_id   = validate_id(options.max_id)
	options.since_id = validate_id(options.since_id)

	queryset
	.orderBy('timestamp', 'desc')
	.limit(options.limit)

	if (options.since_id && options.max_id)
	{
		queryset
		.whereBetween(column_name,
		[
			options.since_id,
			options.since_id + options.max_id
		])
	}
	else if (options.since_id)
	{
		queryset
		.where(column_name, '>', options.since_id)
	}
	else if (options.max_id)
	{
		queryset
		.where(column_name, '<=', options.max_id).toString()

	}

	return queryset
}

function validate_id (id)
{
	var id = toNumber(id)

	if (isInteger(id) && id > 0)
	{
		return id
	}
}


var curry = require('lodash/curry')

var moment = require('moment')

var toId = require('../id').toId

var validate = require('./validate')

var validateId = require('../id').validate
var validateMany = require('../id').validateMany

var Err = require('../Err')

var Filter = module.exports = function Filter (clauses)
{
	return function (queryset, options)
	{
		for (var key in options)
		{
			if (key in clauses)
			{
				queryset = clauses[key](queryset, options[key])
			}
		}

		return queryset
	}
}

Filter.by = {}

Filter.by.operator = curry((operator, column) =>
{
	return function (queryset, value)
	{
		return queryset
		.where(column, operator, value)
	}
})

Filter.by.equal = Filter.by.operator('=')


Filter.by.id = function (err, column)
{
	return function by_id (queryset, id)
	{
		validateId(err, id)

		return queryset
		.where(column, id)
	}
}

Filter.by.ids = function (err, column)
{
	return function by_ids (queryset, ids)
	{
		var ids = ids.split(',')

		validateMany(err, ids)

		return queryset
		.whereIn(column, ids)
	}
}

Filter.by.dateSubtract = function by_date (err, column, unit)
{
	return function (queryset, value)
	{
		//toId и validateId ипользуются т.к их логика подходит
		value = toId(value)
		validateId(err, value)

		var date =  moment()
		.subtract(value, unit)

		return queryset
		.where(column, '>=', date)
	}
}

var WrongYearFilter = Err('wrong_year_filter', 'Wrong year filter')

Filter.by.year = function by_year (column, operator)
{
	return function (queryset, year)
	{
		//toId и validateId ипользуются т.к их логика подходит
		year = toId(year)
		validateId(WrongYearFilter, year)

		var pattern = moment({ year: year })

		return queryset
		.where(column, operator, pattern)
	}
}

Filter.by.name = function by_name (when_column)
{
	return function (queryset, name)
	{
		validate.name(name, 'name')

		var pattern = '%' + name.toLowerCase() + '%'

		return queryset
		.innerJoin('users', 'users.id', when_column)
		.whereRaw("lower(users.first_name || ' ' || users.last_name) LIKE ?",
		pattern)
	}
}

Filter.by.dateRange = (column) =>
{
	column || (column = 'timestamp')

	return (queryset, range) =>
	{
		var from = Number(range[0])
		var to   = Number(range[1])

		from = moment(from)
		to   = moment(to)

		return queryset
		.whereBetween(column, [ from, to ])
	}
}

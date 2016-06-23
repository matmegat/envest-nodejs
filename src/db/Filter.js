
var moment = require('moment')

var toId = require('../id').toId

var validateId = require('../id').validate
var validateMany = require('../id').validateMany
var validateName = require('./validate').name

var Err = require('../Err')

module.exports = function Filter ()
{
	var filter = {}

	filter.clauses = {}

	filter.filtrate = function (queryset, options)
	{
		for (var key in options)
		{
			if (key in this.clauses)
			{
				queryset = this.clauses[key](queryset, options[key])
			}
		}

		return queryset
	}

	filter.clausesByStr = function (column, when)
	{
		return function (queryset, value)
		{
			return queryset
			.where(column, when, value)
		}
	}

	filter.clausesById = function (err, column)
	{
		return function by_id (queryset, id)
		{
			validateId(err, id)

			return queryset
			.whereIn(column, id)
		}
	}

	filter.clausesByIds = function (err, column)
	{
		return function by_ids (queryset, ids)
		{
			var ids = ids.split(',')

			validateMany(err, ids)

			return queryset
			.whereIn(column, ids)
		}
	}

	filter.clausesByDateSubtract = function by_date (err, column, unit)
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

	filter.clausesByYear = function by_year (column, when)
	{
		return function (queryset, year)
		{
			//toId и validateId ипользуются т.к их логика подходит
			year = toId(year)
			validateId(WrongYearFilter, year)

			var pattern = new Date(year.toString())

			return queryset
			.where(column, when, pattern)
		}
	}

	filter.clausesByName = function by_name (when_column)
	{
		return function (queryset, name)
		{
			validateName(name, 'name')

			var pattern = '%' + name.toLowerCase() + '%'

			return queryset
			.innerJoin('users', 'users.id', when_column)
			.whereRaw("lower(users.first_name || ' ' || users.last_name) LIKE ?",
			pattern)
		}
	}

	return filter
}







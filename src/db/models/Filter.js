
var extend = require('lodash/extend')
var moment = require('moment')

var toId = require('../../id').toId

var validateId = require('../../id').validate
var validate   = require('../validate')

var Err = require('../../Err')

var clauses = 
{
	type: by_type,
	investors: by_ids,
	days: by_days,
	name: by_name,
	minyear: by_year('>='),
	maxyear: by_year('<=')
}

module.exports = function Filter (queryset, options)
{
	for(var key in options)
	{
		if (key in clauses)
		{
			queryset = clauses[key](queryset, options[key])
		}
	}

	return queryset
}

function by_type (queryset, value)
{
	return queryset
	.andWhere('type', value)
}

function by_ids (queryset, investors)
{
	var ids = investors.split(',')

	return validateIds(ids)
	.then(() =>
	{
		return queryset
		.whereIn('investor_id', ids)
	})
}

var WrongDaysFilter = Err('wrong_days_filter', 'Wrong days filter')

function by_days (queryset, days)
{
	//toId и validateId ипользуются т.к их логика подходит для проверки days
	days = toId(days)
	validateId(WrongDaysFilter, days)

	var date =  moment()
	.subtract(days, 'days')
	.format('YYYY-MM-DD')

	return queryset
	.andWhereRaw('timestamp >= ?', date)
}

var WrongYearFilter = Err('wrong_year_filter', 'Wrong year filter')

function by_year (when)
{
	return function (queryset, year)
	{
		//toId и validateId ипользуются т.к их логика подходит для проверки year
		year = toId(year)
		validateId(WrongYearFilter, year)

		var pattern = year + '-01-01'

		return queryset
		.andWhere('timestamp', when, pattern)
	}
}

function by_name (queryset, name)
{
	var pattern = '%'+name.toLowerCase()+'%'
	return queryset
	.leftJoin('users', 'users.id', 'feed_items.investor_id')
	.andWhereRaw('lower(users.first_name) LIKE ?', pattern)
	.orWhereRaw('lower(users.last_name) LIKE ?', pattern)
}

var WrongInvestorId = Err('wrong_investor_id', 'Wrong investor id')

function validateIds (ids)
{
	return new Promise(rs =>
	{
		validate.array(ids, 'investors')
		ids.forEach(validateId(WrongInvestorId))

		return rs()
	})
}
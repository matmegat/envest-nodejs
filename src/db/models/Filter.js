
var moment = require('moment')

var toId = require('../../id').toId

var validateId = require('../../id').validate
var validateMany = require('../../id').validateMany
var validateName = require('../validate').name

var Err = require('../../Err')

var clauses =
{
	type: by_type,
	investor: by_id,
	investors: by_ids,
	days: by_date(WrongDaysFilter, 'days'),
	months: by_date(WrongMonthFilter, 'months'),
	name: by_name,
	minyear: by_year('>='),
	maxyear: by_year('<=')
}

module.exports = function Filter (queryset, options)
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

function by_type (queryset, value)
{
	return queryset
	.where('type', value)
}

var WrongInvestorId = Err('wrong_investor_id', 'Wrong Investor Id') //заглушка

function by_id (queryset, investor)
{
	var id = toId(investor)
	validateId(WrongInvestorId, id)

	return queryset
	.where('investor_id', id)
}

function by_ids (queryset, investors)
{
	var ids = investors.split(',')

	validateMany(WrongInvestorId, ids)

	return queryset
	.whereIn('investor_id', ids)
}

var WrongDaysFilter  = Err('wrong_days_filter', 'Wrong days filter')
var WrongMonthFilter = Err('wrong_month_filter', 'Wrong month filter')

function by_date (err, unit)
{
	return function (queryset, value)
	{
		//toId и validateId ипользуются т.к их логика подходит
		value = toId(value)
		validateId(err, value)

		var date =  moment()
		.subtract(value, unit)
		.format('YYYY-MM-DD')

		return queryset
		.where('timestamp', '>=', date)
	}
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
		.where('timestamp', when, pattern)
	}
}

function by_name (queryset, name)
{
	validateName(name, 'name')

	var pattern = '%' + name.toLowerCase() + '%'

	return queryset
	.innerJoin('users', 'users.id', 'feed_items.investor_id')
	.whereRaw("lower(users.first_name || ' ' || users.last_name) LIKE ?", pattern)
}


var util = module.exports = {}

var unwrap = util.unwrap = {}

unwrap.data  = (rs) => rs.data

unwrap.first = (rs) => rs[0]

unwrap.success = (rs) =>
{
	if (! unwrap.isSuccess(rs))
	{
		throw rs
	}

	return rs
}

unwrap.isSuccess = (rs) =>
{
	return rs.Outcome === 'Success'
}


var moment = require('moment')

util.apidate = function apidate (it)
{
	return moment(it).format('M/DD/YYYY')
}

util.apitime = function apitime (it)
{
	return moment(it).format('HH:mm a')
}

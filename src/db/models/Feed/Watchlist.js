
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Watchlist ()
{
	return Type(
	{
		validate: validate_watchlist
		set: (data) =>
		{
			return data
		}
	})
}

function validate_watchlist (data)
{
	var data = pick(data,
	[
		'dir',
		'symbol',
		'text',
		'motivations'
	])

	var watchlist_dirs = ['added', 'removed']
	var validate_watchlist_dir = validate.collection(watchlist_dirs)

	return new Promise(rs =>
	{
		validate_watchlist_dir(data.dir)

		validate.required(data.text, 'text')

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.requied(data.motivations, 'motivations')
		validate.empty(data.motivations, 'motivations')

		rs(data)
	})
}

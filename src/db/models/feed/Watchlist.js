
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Watchlist (watchlist)
{
	return Type(
	{
		validate: validate_watchlist,
		set: (trx, investor_id, type, date, data) =>
		{
			var symbol = data.symbol
			var additional = pick(data,
			[
				'text',
				'motivations',
				'target_price'
			])

			if (data.dir === 'added')
			{
				return watchlist.investor.add(investor_id, symbol, additional)
			}
			else
			{
				return watchlist.investor.remove(investor_id, symbol)
			}
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

		rs(data)
	})
}
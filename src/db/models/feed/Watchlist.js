
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
		'target_price',
		'motivations'
	])

	var watchlist_dirs = ['added', 'removed']
	var validate_watchlist_dir = validate.collection(watchlist_dirs)
	var validate_motivations_length = validate.length(3, 1)

	return new Promise(rs =>
	{
		validate_watchlist_dir(data.dir)

		validate.required(data.text, 'text')

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.target_price, 'target_price')
		validate.empty(data.target_price, 'target_price')
		validate.number.positive(data.target_price, 'target_price')

		validate.required(data.motivations, 'motivations')
		validate.array(data.motivations, 'motivations')
		validate_motivations_length(data.motivations, 'motivations')

		rs(data)
	})
}

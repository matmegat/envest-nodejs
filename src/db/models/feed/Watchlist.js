
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Watchlist (db)
{
	return Type(
	{
		validate: validate_watchlist,
		set: (trx, investor_id, type, date, data) =>
		{
			var additional = pick(data,
			[
				'target_price'
			])

			return db.symbols.resolve(data.symbol)
			.then(symbl =>
			{
				data.symbol = pick(symbl,
				[
					'ticker',
					'exchange'
				])
			})
			.then(() =>
			{
				if (data.dir === 'added')
				{
					return db.watchlist.investor.add(investor_id, data.symbol, additional)
				}
				else
				{
					return db.watchlist.investor.remove(investor_id, data.symbol)
				}
			})
			.then(() =>
			{
				return feed.create(trx, investor_id, type, date, data)
			})
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

	return new Promise(rs =>
	{
		validate_watchlist_dir(data.dir)

		validate.required(data.text, 'text')
		validate.empty(data.text, 'text')

		validate.required(data.symbol, 'symbol')
		validate.empty(data.symbol, 'symbol')

		validate.required(data.target_price, 'target_price')
		validate.empty(data.target_price, 'target_price')
		validate.number.positive(data.target_price, 'target_price')

		validate.motivation(data.motivations)

		rs(data)
	})
}

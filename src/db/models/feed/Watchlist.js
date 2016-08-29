
var Type = require('./Type')

var pick = require('lodash/pick')
var assign = require('lodash/assign')

var validate = require('../../validate')

module.exports = function Watchlist (db)
{
	return Type(
	{
		validate: validate_watchlist,
		validate_update: validate_watchlist_adds,
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
					return db.watchlist.investor.add(
						investor_id,
						data.symbol,
						additional
					)
				}
				else
				{
					return db.watchlist.investor.remove(investor_id, data.symbol)
				}
			})
			.then(() =>
			{
				return data
			})
		},
		update: (trx, investor_id, type, date, data, post_id) =>
		{
			return feed.postByInvestor(trx, post_id, investor_id)
			.then(item =>
			{
				return assign({}, item.data, data)
			})
		},
		remove: () =>
		{
			return
		}
	})

	function validate_watchlist_adds (data)
	{
		var data_update = pick(data,
		[
			'text',
			'motivations'
		])

		var data_restricted = pick(data,
		[
			'dir',
			'symbol',
			'target_price'
		])

		return new Promise(rs =>
		{
			validate.forbidden(data_restricted)

			validate.empty(data_update.text, 'text')

			data_update.motivations && validate.motivation(data_update.motivations)

			rs(data_update)
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

			validate.required(data.motivations, 'motivations')
			validate.motivation(data.motivations)

			rs(data)
		})
	}
}

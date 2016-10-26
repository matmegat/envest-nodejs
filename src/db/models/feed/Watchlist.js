
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')
var sanitize = require('../../../sanitize')

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
				data.text = sanitize(data.text)

				return data
			})
		},
		update: (trx, investor_id, type, date, data) =>
		{
			data.text = sanitize(data.text)

			return Promise.resolve(data)
		},
		remove: (trx, post) =>
		{
			var data = post.data
			var investor_id = post.investor_id

			if (data.dir === 'added')
			{
				return db.watchlist.investor.remove(investor_id, data.symbol)
			}
			
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

			if ('text' in data_update)
			{
				validate.nullish(data_update.text, 'text')
				validate.text_field(data_update.text, 'text')
			}

			if ('motivations' in data_update)
			{
				validate.motivation(data_update.motivations)
			}

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
			validate.text_field(data.text, 'text')

			validate.required(data.symbol, 'symbol')
			validate.empty(data.symbol, 'symbol')

			if (data.dir === 'added')
			{
				validate.required(data.target_price, 'target_price')
				validate.empty(data.target_price, 'target_price')
				validate.number.positive(data.target_price, 'target_price')
			}

			validate.required(data.motivations, 'motivations')
			validate.motivation(data.motivations)

			rs(data)
		})
	}
}

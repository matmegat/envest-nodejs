
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')
var Err = require('../../../Err')

var PostPicNotFound = Err('post_pic_not_found',
	'No corresponding picture for this hash')

module.exports = function Update (db)
{
	return Type(
	{
		validate: validate_update,
		validate_update: validate_update_additionals,
		set: upsert,
		update: upsert
	})

	function upsert (trx, investor_id, type, date, data, post_id)
	{
		return db.symbols.resolveMany(data.symbols)
		.then(symbls =>
		{
			data.symbols = symbls
			.map(item =>
			{
				return pick(item,
				[
					'ticker',
					'exchange'
				])
			})

			return data
		})
	}

	function validate_update_additionals (data)
	{
		var data = pick(data,
		[
			'symbols',
			'title',
			'text',
			'pic'
		])

		return new Promise(rs =>
		{
			validate.empty(data.text, 'text')

			validate.empty(data.title, 'title')

			if (data.symbols)
			{
				validate.empty(data.symbols, 'symbols')
				validate.array(data.symbols, 'symbols')
				validate_symbols_length(data.symbols, 'symbols')
			}

			validate.empty(data.pic, 'pic')

			rs(data)
		})
		.then(validate_pic_exists)
	}

	function validate_update (data)
	{
		var data = pick(data,
		[
			'symbols',
			'title',
			'text',
			'pic'
		])

		var validate_symbols_length = validate.length(6, 1)

		return new Promise(rs =>
		{
			validate.required(data.text, 'text')
			validate.empty(data.text, 'text')

			validate.required(data.title, 'title')
			validate.empty(data.title, 'title')

			validate.required(data.symbols, 'symbols')
			validate.empty(data.symbols, 'symbols')
			validate.array(data.symbols, 'symbols')
			validate_symbols_length(data.symbols, 'symbols')

			validate.empty(data.pic, 'pic')

			rs(data)
		})
		.then(validate_pic_exists)
	}

	function validate_pic_exists (data)
	{
		if (data.pic)
		{
			return db.static.exists(data.pic)
			.then(so =>
			{
				if (! so)
				{
					throw PostPicNotFound({ hash: data.pic })
				}

				return data
			})
		}

		return data
	}
}

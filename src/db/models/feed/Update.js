
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')
var Err = require('../../../Err')

module.exports = function Update (db)
{
	return Type(
	{
		validate: validate_update,
		set: (trx, investor_id, type, date, data) =>
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
			})
			.then(() =>
			{
				return db.feed.create(trx, investor_id, type, date, data)
			})
		}
	})

	function validate_update (data)
	{
		var PostPicNotFound = Err('post_pic_not_found',
			'Post Pic Not Found')

		var data = pick(data,
		[
			'symbols',
			'title',
			'text',
			'pic'
		])

		validate.required(data.text, 'text')
		validate.empty(data.text, 'text')

		validate.required(data.title, 'title')
		validate.empty(data.title, 'title')

		validate.required(data.symbols, 'symbols')
		validate.empty(data.symbols, 'symbols')
		validate.array(data.symbols, 'symbols')

		validate.empty(data.pic, 'pic')

		return Promise.resolve()
		.then(() =>
		{
			if (data.pic)
			{
				return db.static.exists(data.pic)
				.then(is_exists =>
				{
					if (! is_exists)
					{
						throw PostPicNotFound({ hash: data.pic })
					}
				})
			}
		})
		.then(() =>
		{
			return data
		})
	}
}


var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Update (symbols, feed)
{
	return Type(
	{
		validate: validate_update,
		set: (trx, investor_id, type, date, data) =>
		{
			return symbols.resolveMany(data.symbols)
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
				return feed.create(trx, investor_id, type, date, data)
			})
		}
	})
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

	return new Promise(rs =>
	{
		validate.required(data.text, 'text')
		validate.empty(data.text, 'text')

		validate.required(data.title, 'title')
		validate.empty(data.title, 'title')

		validate.required(data.symbols, 'symbols')
		validate.empty(data.symbols, 'symbols')
		validate.array(data.symbols, 'symbols')

		validate.empty(data.pic, 'pic')

		rs(data)
	})
}

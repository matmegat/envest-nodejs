
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Update (feed)
{
	return Type(
	{
		validate: validate_update,
		set: (investor_id, type, date, data) =>
		{
			return feed.create(investor_id, type, date, data)
		}
	})
}

function validate_update (data)
{
	console.log(data)

	var data = pick(data,
	[
		'symbols',
		'title',
		'text',
		'motivations'
	])

	return new Promise(rs =>
	{
		validate.required(data.text, 'text')
		validate.required(data.title, 'title')

		validate.required(data.symbols, 'symbols')
		validate.empty(data.symbols, 'symbols')

		rs(data)
	})
}

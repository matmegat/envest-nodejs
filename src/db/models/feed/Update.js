
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')

module.exports = function Update ()
{
	return Type(
	{
		validate: validate_update,
		set: () =>
		{
			return
		}
	})
}

function validate_update (data)
{
	var data = pick(data,
	[
		'symbols',
		'title',
		'text'
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

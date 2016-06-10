
module.exports = function Onboarding (db, investor)
{
	var onb = {}

	onb.fields = {}

	onb.fields.profession = Profession(investor)

	return onb
}


var Field = require('./Field')
var validate = require('../../validate')


function Profession (investor)
{
	return Field(
	{
		validate: (value) =>
		{
			validate.string(value)
			validate.empty(value)
			return value
		},
		set: (value) =>
		{

		},
		get: () =>
		{

		}
	})
}

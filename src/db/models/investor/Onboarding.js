
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
	return Field(investor,
	{
		validate: (value) =>
		{
			validate.string(value)
			validate.empty(value)
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ profession: value })
		},
		get: (queryset) =>
		{
			return queryset.select('profession')
			.then(rows => rows[0])
			.then(row  => row.profession)
		}
	})
}

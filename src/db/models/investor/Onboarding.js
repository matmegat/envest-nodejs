
module.exports = function Onboarding (db, investor)
{
	var onb = {}

	onb.fields = {}

	onb.fields.profession = Profession(investor)
	onb.fields.focus = Focus(investor)

	onb.update = function update (investor_id, field, value)
	{
		return new Promise(rs =>
		{
			if (! (field in onb.fields))
			{
				throw WrongField({ field: field })
			}

			field = onb.fields[field]

			rs(field.set(investor_id, value))
		})
	}

	return onb
}

var Err = require('../../../Err')
var WrongField = Err('wrong_field', 'Wrong Onboarding field')


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


var validateFocusLength = validate.length(250)

function Focus (investor)
{
	return Field(investor,
	{
		value: (value) =>
		{
			validate.string(value)
			validate.empty(value)
			validateFocusLength(value)
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ focus: value })
		},
		get: () => {}
	})
}

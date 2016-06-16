
var Err = require('../Err')

var validate = module.exports = {}


var FieldRequired = Err('field_required', 'Field is required')

validate.required = function valudate__required (field, name)
{
	if (field == null)
	{
		throw FieldRequired({ field: name })
	}
}


var FieldEmpty = Err('field_empty', 'Field must not be empty')

validate.empty = function validate__empty (field, name)
{
	if (field === '')
	{
		throw FieldEmpty({ field: name })
	}
}


var FieldType = Err('field_wrong_type', 'Field must have certain type')

validate.string = function validate__string (field, name)
{
	if (typeof field !== 'string')
	{
		throw FieldType({ field: name, type: 'string' })
	}
}


var FieldLength = Err('field_wrong_length', 'Field must have certain type')

validate.length = function validate__length (max)
{
	return (field, name) =>
	{
		var actual = field.length

		if (actual > max)
		{
			throw FieldLength({ field: name, actual: actual, max: max })
		}
	}
}

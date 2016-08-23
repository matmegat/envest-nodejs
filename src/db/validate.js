
var Err = require('../Err')
var moment = require('moment')

var includes = require('lodash/includes')
var moment = require('moment')

var validate = module.exports = {}


var FieldRequired = Err('field_required', 'Field is required')

validate.required = function validate__required (field, name)
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


validate.json = function validate__json (json, name)
{
	try
	{
		JSON.parse(json)
	}
	catch (e)
	{
		throw FieldType({ field: name, type: 'json' })
	}
}


validate.array = function validate__array (field, name)
{
	if (! Array.isArray(field))
	{
		throw FieldType({ field: name, type: 'array' })
	}
}


validate.number = function validate__number (field, name)
{
	if (typeof field !== 'number' || ! isFinite(field))
	{
		throw FieldType({ field: name, type: 'number' })
	}
}


var isFinite = require('lodash/isFinite')

validate.number = function validate__number (field, name)
{
	if (! isFinite(field))
	{
		throw FieldType({ field: name, type: 'number' })
	}
}

validate.number.decimal = function (power)
{
	var max = Math.pow(10, power)

	return (field, name) =>
	{
		validate.number(field, name)

		if (! (Math.abs(field) < max))
		{
			throw FieldType({ field: name, type: 'decimal', power: power })
		}
	}
}

validate.number.positive = function (field, name)
{
	validate.number(field, name)

	if (! (field > 0))
	{
		throw FieldType({ field: name, type: 'number/positive' })
	}
}


var isInteger = require('lodash/isInteger')

validate.integer = function validate__integer (field, name)
{
	if (! isInteger(field))
	{
		throw FieldType({ field: name, type: 'integer' })
	}
}

// eslint-disable-next-line id-length
validate.integer.positive = function validate__integer__positive (field, name)
{
	validate.integer(field, name)
	validate.number.positive(field, name)
}


var FieldLength = Err('field_wrong_length', 'Field cannot supercede length')

validate.length = function validate__length (max, min)
{
	return (field, name) =>
	{
		var actual = field.length

		if (actual > max)
		{
			throw FieldLength({ field: name, actual: actual, max: max })
		}

		if (min && actual < min)
		{
			throw FieldLength({ field: name, actual: actual, min: min })
		}
	}
}

var WrongDate = Err('wrong_date_format', 'Wrong Date Format')

validate.date = function validate__date (date)
{
	var date = moment(date)

	if (! date.isValid())
	{
		throw WrongDate()
	}
}

var NotIncluded = Err('item_not_included', 'Item Not Included')

validate.collection = function validate__collection (collection)
{
	return function (item)
	{
		if (! includes(collection, item))
		{
			throw NotIncluded({ possible_values: collection, item: item })
		}
	}
}

var validate_motivations_len = validate.length(3, 1)

validate.motivation = function validate__motivations (motivations)
{
	validate.required(motivations, 'motivations')
	validate.array(motivations, 'motivations')
	validate_motivations_len(motivations, 'motivations')

	motivations.forEach(el =>
	{
		validate.required(el.id, 'motivation id')
		validate.empty(el.id, 'motivation id')
		validate.integer(el.id, 'motivation id')

		validate.required(el.text, 'motivation text')
		validate.empty(el.text, 'motivation text')
	})
}

var XRegExp = require('xregexp')
var WrongName = Err('wrong_name_format', 'Wrong name format')

var validate_name_length = validate.length(255)

validate.name = function validate__name (name, field_name)
{
	validate.required(name, field_name)
	validate.empty(name, field_name)

	validate_name_length(name, field_name)

	/*
	   Two words minimum, separated by space.
	   Any alphabet letters,
	   dashes, dots and spaces (not more than one successively).

	   Should begin with a letter and end with a letter or dot.
	*/
	var re = XRegExp.build(`^ {{word}} (\\s {{word}})* $`,
	{
		word: XRegExp(`\\pL+ ([' -] \\pL+)* \\.?`, 'x')
	},
	'x')

	if (! re.test(name))
	{
		throw WrongName()
	}
}

var WrongEmail = Err('wrong_email_format', 'Wrong email format')

validate.email = function validate__email (email)
{
	validate.required(email, 'email')
	validate.empty(email, 'email')

	if (email.length > 254)
	{
		throw WrongEmail()
	}

	var emailRe = /@/

	if (! emailRe.test(email))
	{
		throw WrongEmail()
	}
}

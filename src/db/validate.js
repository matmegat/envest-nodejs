
var Err = require('../Err')

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


var FieldLength = Err('field_wrong_length', 'Field cannot supercede length')

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


var WrongJSON = Err('wrong_json', 'Wrong JSON')

validate.json = function validate__json (json, name)
{
	try
	{
		JSON.parse(json)
	}
	catch (e)
	{
		throw WrongJSON({ field: name })
	}
}


var ArrayRequired = Err('array_required', 'Requires array')

validate.array = function validate__array (ar, name)
{
	if (! Array.isArray(ar))
	{
		throw ArrayRequired({ field: name })
	}
}


var XRegExp = require('xregexp')
var WrongName = Err('wrong_name_format', 'Wrong name format')

var validateNameLength = validate.length(255)

validate.name = function validate__name (name, field_name)
{
	validate.required(name, field_name)
	validate.empty(name, field_name)
	validateNameLength(name, field_name)

	/*
	   Two words minimum, separated by space.
	   Any alphabet letters,
	   dashes, dots and spaces (not more than one successively).

	   Should begin with a letter and end with a letter or dot.
	*/
	var re = XRegExp.build(`^ {{word}} (\\s {{word}})? $`,
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

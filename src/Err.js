
var Err = module.exports = function Err (code, message)
{
	return function ErrInst (data)
	{
		var err = inst()

		err.code    = code
		err.message = message

		data && (err.data = data)

		return err
	}
}

var create = Object.create
var proto  = { isErr: Err }
var inst = () => create(proto)

Err.is = function (err)
{
	return err.isErr === Err
}


var curry = require('lodash/curry')

/*
 * checks for pred(error) and rethrows new error
 *   if  true -> fn(error)
 *      false -> noop
 *
 * usage:
 *   .catch(rethrow(CheckOldError, ConstructNewError))
 */
var rethrow = Err.rethrow = curry(function rethrow (pred, fn)
{
	return (error) =>
	{
		if (pred(error))
		{
			throw fn(error)
		}
		else
		{
			throw error
		}
	}
})

Err.fromCode = function (code, fn)
{
	return rethrow(error =>
	{
		if (! Err.is(error))   { return false }
		if (Err.code !== code) { return false }

		return true
	}
	, fn)
}

Err.fromDb = function (constraint, fn)
{
	return rethrow(error =>
	{
		/* check for constraint to be desired */
		if (! error.constraint)              { return false }
		if (error.constraint !== constraint) { return false }

		return true
	}
	,
	() =>
	{
		/* upgrade to ErrInst */
		return fn(/* mask error */)
	})
}


/*
 * checks for pred(value)
 * if  true -> rethrow fn()
 *    false -> proceed with value
 *
 * usage:
 *   .then(shortcut(IsValueBad, NewError))
 */
var shortcut = Err.shortcut = curry(function (pred, fn)
{
	return (value) =>
	{
		if (pred(value))
		{
			throw fn()
		}
		else
		{
			return value
		}
	}
})


Err.nullish  = shortcut(it => it == null)
Err.falsy    = shortcut(it => ! it)
Err.existent = shortcut(it => !! it)

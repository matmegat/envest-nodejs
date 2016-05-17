
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

Err.nullish = function (fn)
{
	return (it) =>
	{
		if (it == null)
		{
			throw fn()
		}

		return it
	}
}

Err.falsy = function (fn)
{
	return (it) =>
	{
		if (! it)
		{
			throw fn()
		}

		return it
	}
}

Err.existent = function (fn)
{
	return (it) =>
	{
		if (it)
		{
			throw fn()
		}

		return it
	}
}



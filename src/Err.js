
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


Err.fromDb = function (constraint, fn)
{
	return (error) =>
	{
		if (! error.constraint) throw error
		if (error.constraint !== constraint) throw error

		/* upgrade to ErrInst */
		error = fn(/* error */)

		throw error
	}
}

Err.nullish = function (fn)
{
	return (it) =>
	{
		// eslint-disable-next-line eqeqeq
		if (it == null)
		{
			throw fn()
		}

		return it
	}
}

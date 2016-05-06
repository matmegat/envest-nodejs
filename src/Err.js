
var Err = module.exports = function Err (code, message)
{
	return function ErrInst (data)
	{
		var err =
		{
			code: code,
			message: message
		}

		data && (err.data = data)

		return err
	}
}

Err.fromDb = function (constraint, fn)
{
	return (error) =>
	{
		if (! error.constraint) throw error
		if (error.constraint !== constraint) throw error

		/* upgrade to ErrInst */
		error = fn(error)

		throw error
	}
}

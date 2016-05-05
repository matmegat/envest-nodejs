
module.exports = function Err (code, message)
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

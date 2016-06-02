
module.exports = function Emit (db, notifications)
{
	var emit = {}

	emit.inst = function (type)
	{
		return function emitInst ()
		{
			return {
				type: type
			}
		}
	}

	emit.addComments = function (fn, recipient_id, count)
	{
		var type = fn().type

		var event = { count: count }

		return notifications.create(type, JSON.stringify(event), recipient_id)
	}

	return emit
}

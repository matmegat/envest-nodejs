
var extend = Object.assign
var one = require('./helpers').one

module.exports = function upsert (table, constraint, returning)
{
	return (key_pair, data) =>
	{
		var full_data = extend({}, data, key_pair)

		return table.insert(full_data, returning)
		.catch(error =>
		{
			if (error.constraint === constraint)
			{
				return table.update(data, returning)
				.where(key_pair)
			}
			else
			{
				throw error
			}
		})
		.then(one)
	}
}


var extend = Object.assign
var oneMaybe = require('./helpers').oneMaybe
var one = require('./helpers').one

module.exports = function upsert (table, returning)
{
	var cloned_table = () => table.clone()

	return (key_pair, data) =>
	{
		var full_data = extend({}, data, key_pair)

		return cloned_table().select()
		.where(key_pair)
		.then(oneMaybe)
		.then(Boolean)
		.then(so =>
		{
			if (! so)
			{
				return cloned_table()
				.insert(full_data, returning)
			}
			else
			{
				return cloned_table()
				.update(data, returning)
				.where(key_pair)
			}
		})
		.then(one)
	}
}


var extend = Object.assign

exports.seed = (knex) =>
{
	var now  = +new Date
	var prev = now - 1000 * 60 * 60

	return get('david.philips@investor.com')
	.then(user =>
	{
		var id = user.id

		/* eslint-disable max-len */
		return insert(id,
		[
			{ timestamp: prev, cash: 10000, multiplier: 1 },
			{ timestamp: now,  cash: 11000, multiplier: 1 }
		])
		/* eslint-enable max-len */
	})


	function get (email)
	{
		return knex('users').where('email', email)
		.then(rows => rows[0])
	}

	function insert (id, entries)
	{
		entries = entries.map(entry =>
		{
			return extend({}, entry,
			{
				investor_id:     id,
				timestamp:   new Date(entry.timestamp)
			})
		})

		return knex('brokerage').insert(entries)
	}
}

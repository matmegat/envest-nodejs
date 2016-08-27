
var extend = Object.assign

exports.seed = (knex) =>
{
	var hr = (hr) => hr * 1000 * 60 * 60
	var s = (s) => s * 1000

	var now  = +new Date('Sat Aug 27 2016 20:05:58 +03')
	var prev = now - hr(1)
	var prev_init = prev - hr(1)

	var CASH = 100000

	return get('david.philips@investor.com')
	.then(user =>
	{
		var id = user.id

		/* eslint-disable max-len */
		return insert(id,
		[
			{ timestamp: prev_init, cash: CASH },
			{ timestamp: prev,      cash: CASH-100 },
			{ timestamp: prev+s(1), cash: CASH-100-120 },
			{ timestamp: now,       cash: 99680 },
			{ timestamp: now+s(1),  cash: 98680 },
			{ timestamp: now+s(2),  cash: 98680+130 }
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
			return extend(
			{
				multiplier: 1,
			},
			entry,
			{
				investor_id:     id,
				timestamp:   new Date(entry.timestamp)
			})
		})

		return knex('brokerage').insert(entries)
	}
}

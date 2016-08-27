
var extend = Object.assign

exports.seed = (knex) =>
{
	var day = (day) => day * 1000 * 60 * 60 * 24
	var s = (s) => s * 1000

	var now  = +new Date('Sat Aug 27 2016 20:05:58 +03')
	var prev = now - day(1)
	var prev_init = prev - day(1)

	var CASH = 100000

	return get('david.philips@investor.com')
	.then(user =>
	{
		var id = user.id

		/* eslint-disable max-len */
		/* eslint-disable space-infix-ops */
		return insert(id,
		[
			{ timestamp: prev_init, cash: CASH },
			{ timestamp: prev,      cash: CASH-100 },
			{ timestamp: prev+s(1), cash: CASH-100-120 },
			{ timestamp: now,       cash: 99580 },
			{ timestamp: now+s(1),  cash: 97580 },
			{ timestamp: now+day(1), cash: 97580+130 },
			{ timestamp: now+day(1)+s(1), cash: 97580+130+1200 }
		])
		/* eslint-enable max-len */
		/* eslint-enable space-infix-ops */
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

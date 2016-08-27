
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
			{ symbol_exchange: 'XNAS', symbol_ticker: 'TSLA', amount: 1, price: 100,  timestamp: prev   },
			{ symbol_exchange: 'XNYS', symbol_ticker: 'GE',   amount: 1, price: 120,  timestamp: prev+1 },
			{ symbol_exchange: 'XNAS', symbol_ticker: 'TSLA', amount: 2, price: 100,  timestamp: now    },
			{ symbol_exchange: 'XNAS', symbol_ticker: 'AAPL', amount: 1, price: 1000, timestamp: now+1  },
			{ symbol_exchange: 'XNYS', symbol_ticker: 'GE',   amount: 0, price: 130,  timestamp: now+2  },
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

		return knex('portfolio').insert(entries)
	}
}

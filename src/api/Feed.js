
var Router = require('express').Router

module.exports = function Feed ()
{
	var feed = {}

	feed.express = Router()

	feed.express.get('/latest', (rq, rs) =>
	{
		var dummy = [ dummy_post() ]

		rs.json(dummy)
	})

	return feed
}

function dummy_post ()
{
	var response =
	{
		id: 1,
		timestamp: dummy_date(),

		investor:
		{
			id: 1,
			name: 'Allen Schwartzh',
			pic: null
		},

		event:
		{
			type: 'Trade',
			data: // data is related to `type` and depends on it
			{
				dir: 'sold',

				symbol:
				{
					ticker: 'ZG',
					company: 'ZILLOW',
				},

				price: 150,
				amount: 100,

				text: 'I want to sell all my assets and become a downshifter.',

				risk: 'low', // low|medium|high
				motivations:
				[
					'Earnings', // maybe this will be expanded to motivation Objects
					'Valuation',
					'Growth Potential'
				]
			}
		}
	}

	return response
}


function dummy_date ()
{
	return (new Date).toISOString()
}

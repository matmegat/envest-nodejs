
var times = require('lodash/times')
var Router = require('express').Router

module.exports = function Feed ()
{
	var feed = {}

	feed.express = Router()

	var dummy_id = Id()
	var feed_length = 10

	feed.express.get('/latest', (rq, rs) =>
	{
		var data = times(feed_length, dummy_post)
		.map(function (post)
		{
			post.id = dummy_id()

			return post
		})

		rs.json(data)
	})

	return feed
}

function dummy_post ()
{
	var post =
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

	return post
}


function dummy_date ()
{
	return (new Date).toISOString()
}

function Id ()
{
	var id = 0

	return function dummy_id ()
	{
		id = id + 1

		return id
	}
}

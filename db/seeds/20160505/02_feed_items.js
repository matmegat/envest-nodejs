var motivations = require('../../../src/db/models/Motivations')()
var _ = require('lodash')

var dummyEvents =
[
	{
		type: 'trade',
		data:
		{
			dir: 'bought',
			symbol:
			{
				ticker: 'ZG',
				company: 'ZILLOW',
			},
			price: Math.floor(Math.random() * 100),
			amount: Math.floor(Math.random() * 1000),
			text: 'I want to become a downshifter.',
			risk: 'low',
			motivations: _.sampleSize(motivations, 3)
		}
	},
	{
		type: 'trade',
		data:
		{
			dir: 'sold',
			symbol:
			{
				ticker: 'ZG',
				company: 'ZILLOW',
			},
			price: Math.floor(Math.random() * 100),
			amount: Math.floor(Math.random() * 1000),
			text: 'I want to sell all my assets and become a downshifter.',
			risk: 'medium',
			motivations: _.sampleSize(motivations, 3)
		}
	},
	{
		type: 'watchlist',
		data:
		{
			dir: 'added',
			symbol:
			{
				ticker: 'ZG',
				company: 'ZILLOW',
			},
			text: 'I want to follow it',
			motivations: _.sampleSize(motivations, 3)
		}
	},
	{
		type: 'watchlist',
		data:
		{
			dir: 'removed',
			symbol:
			{
				ticker: 'ZG',
				company: 'ZILLOW',
			},
			text: 'I don\'t want to follow it',
			motivations: _.sampleSize(motivations, 3)
		}
	},
	{
		type: 'update',
		data:
		{
			stocks:
			[
				{
					ticker: 'ZG',
				},
				{
					ticker: 'AAPL',
				},
				{
					ticker: 'CMG',
				},
			],
			title: 'Title of the Update Event',
			text: 'Just an update.',
		}
	},
]

exports.seed = function (knex)
{
	return knex('feed_items').del()
	.then(() =>
	{
		return knex('investors')
		.select('id')
	})
	.then((investors) =>
	{
		var items = _.times(50, (i) =>
		{
			return {
				timestamp: new Date(new Date().getTime() + i),
				investor_id: investors[_.random(investors.length - 1)].id,
				event: dummyEvents[i % dummyEvents.length]
			}
		})

		return knex('feed_items').insert(items)
	})
}

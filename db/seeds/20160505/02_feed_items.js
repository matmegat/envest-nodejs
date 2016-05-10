var motivations = require('../../../src/db/Motivations')()
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
				price: Math.floor(Math.random()*100),
				amount: Math.floor(Math.random()*1000),
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
				price: Math.floor(Math.random()*100),
				amount: Math.floor(Math.random()*1000),
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
						company: 'ZILLOW',
					},
				],
				text: 'Just an update.',
			}
		},
	]

exports.seed = function (knex, Promise)
{
	var seedItems = _.times(50, (i) =>
	{
		return knex('feed_items').insert(
		{
			id: i + 1,
			timestamp: new Date(new Date().getTime() + i),
			investor_id: Math.floor(Math.random() * 4 + 1),
			event: dummyEvents[i % dummyEvents.length]
		})
	})
	seedItems.splice(0, 0, knex('feed_items').del())

	return Promise.join.apply(this, seedItems)
}

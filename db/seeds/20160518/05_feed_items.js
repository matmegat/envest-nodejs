var _ = require('lodash')

var motivations = require('../../../src/db/models/Motivations')()

var dummmy_events =
[
	{
		type: 'trade',
		data:
		{
			dir: 'bought',
			symbol: null,
			price: Math.floor(Math.random() * 100),
			amount: Math.floor(Math.random() * 1000),
			text: 'I want to become a downshifter.',
			risk: 'low',
			motivations: null
		}
	},
	{
		type: 'trade',
		data:
		{
			dir: 'sold',
			symbol: null,
			price: Math.random() * 100,
			amount: Math.floor(Math.random() * 1000),
			text: 'I want to sell all my assets and become a downshifter.',
			risk: 'medium',
			motivations: null
		}
	},
	{
		type: 'watchlist',
		data:
		{
			dir: 'added',
			symbol: null,
			text: 'I want to follow it',
			motivations: null
		}
	},
	{
		type: 'watchlist',
		data:
		{
			dir: 'removed',
			symbol: null,
			text: 'I don\'t want to follow it',
			motivations: null
		}
	},
	{
		type: 'update',
		data:
		{
			symbols: null,
			title: 'Title of the Update Event',
			text: 'Just an update.',
			motivations: null
		}
	}
]

exports.seed = function (knex)
{
	return knex('investors')
	.select('user_id as id')
	.then((investors) =>
	{
		return knex('symbols')
		.then((symbols) =>
		{
			return _.extend({},
			{
				investors: investors,
				symbols: symbols
			})
		})
	})
	.then((data) =>
	{
		var investors = data.investors
		var symbols = data.symbols

		var feed_items = _.times(100, (i) =>
		{
			var event = _.cloneDeep(
				dummmy_events[_.random(dummmy_events.length - 1)]
			)

			if (event.type === 'update')
			{
				event.data.symbols = _.sampleSize(symbols, _.random(1, 3))
			}
			else
			{
				event.data.symbol = symbols[_.random(symbols.length - 1)]
				event.data.motivations = _.sampleSize(motivations, _.random(1, 3))
			}

			return {
				timestamp: new Date(new Date().getTime() + i),
				investor_id: investors[_.random(investors.length - 1)].id,
				event_type: event.type,
				event: event.data
			}
		})

		return knex('feed_items').insert(feed_items)
	})
}

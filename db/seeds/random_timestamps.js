var _ = require('lodash')

exports.seed = function (knex)
{
	return knex('investors')
	.select('user_id as id')
	.then((investors) => {
		var feed_items = _.times(500, (i) =>
		{
			var timestamp = new Date()

			if (i % 2)
			{
				timestamp = new Date(new Date().getTime() + _.random(-10000, 10000))
			}
			return {
				timestamp: timestamp,
				investor_id: investors[_.random(investors.length - 1)].id,
				event: { type: 'random' }
			}
		})

		return knex('feed_items').insert(feed_items)
	})
}

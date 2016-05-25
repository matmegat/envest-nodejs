var _ = require('lodash')

exports.seed = function (knex)
{
	return knex('comments').del()
	.then(() =>
	{
		return knex('feed_items')
		.select('id')
	})
	.then((feed_items) =>
	{
		return knex('users')
		.select('id')
		.then((users) =>
		{
			return _.extend({},
			{
				feed_items: feed_items,
				users: users
			})
		})
	})
	.then((data) =>
	{
		var feed_items = data.feed_items
		var users = data.users
		var comments = _.times(50, (i) =>
		{
			var user_id = users[_.random(users.length - 1)].id
			var feed_id = feed_items[_.random(feed_items.length - 1)].id

			return {
				timestamp: new Date(new Date().getTime() + i),
				user_id: user_id,
				feed_id: feed_id,
				text: 'Random comment for Feed Item #' +
					feed_id + ' from user #' + user_id
			}
		})

		return knex('comments').insert(comments)
	})
}

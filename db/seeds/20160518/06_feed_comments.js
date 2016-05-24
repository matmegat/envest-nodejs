var _ = require('lodash')

exports.seed = function (knex, Promise)
{
	return knex('users')
	.select('id')
	.then((users) =>
	{
		return knex('feed_items')
		.select('id')
		.then((feed_items) =>
		{
			return _.extend({},
			{
				users: users,
				feed_items: feed_items
			})
		})
	})
	.then((data) =>
	{
		var users = data.users
		var feed_items = data.feed_items

		var feed_comments = []
		feed_items.forEach((feed_item) =>
		{
			_.times(_.random(5), (i) =>
			{
				var user_id = users[_.random(users.length - 1)].id

				feed_comments.push(
				{
					timestamp: new Date(new Date().getTime() + i),
					user_id: user_id,
					feed_id: feed_item.id,
					text: 'Random comment for Feed Item #' +
						feed_item.id + ' from user #' + user_id
				})
			})
		})

		return knex('comments').insert(feed_comments)
	})
}

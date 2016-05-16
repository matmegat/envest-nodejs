var _ = require('lodash')

exports.seed = function (knex, Promise)
{
	return knex('comments').del()
	.then(() =>
	{
		var comments = _.times(50, (i) =>
		{
			var user_id = Math.floor(Math.random() * 3 + 1)
			var feed_id = Math.floor(Math.random() * 50 + 1)

			return knex('comments')
			.insert(
			{
				timestamp: new Date(new Date().getTime() + i),
				user_id: user_id,
				feed_id: feed_id,
				text: 'Random comment for Feed Item #' +
					feed_id + ' from user #' + user_id
			})
		})

		return Promise.all(comments)
	})
}


var Err = require('../../Err')

var noop = require('lodash/noop')

module.exports = function Abuse (db, comments)
{
	var abuse = {}

	var knex = db.knex

	abuse.table = () => knex('abuse_comments')

	var CommentNotExist = Err('comment_not_exist', 'Comment not exist')
	var AbuseExist = Err('abuse_exist', 'Abuse exist')
	var YourComments = Err('is_your_comment', 'It is impossible to abuse for your comments')

	abuse.create = function (user_id, comment_id)
	{
		return comments.byId(comment_id)
		.then(Err.nullish(CommentNotExist))
		.then((comment_items) =>
		{
			if (comment_items.user_id != user_id)
			{
				return abuse.table()
				.insert({
					user_id: user_id,
					comment_id: comment_id
				})
				.then(noop)
			}

			throw YourComments()
		})
		.catch(Err.fromDb('abuse_comments_pkey', AbuseExist))
	}

	return abuse
}


var Err = require('../../Err')

var CommentNotExist = Err('comment_not_exist', 'Comment not exist')
var AbuseExist = Err('abuse_exist', 'Abuse exist')
var YourComments
  = Err('is_your_comment', 'It is impossible to abuse your comments')


var noop = require('lodash/noop')

module.exports = function Abuse (db, comments, notifications_emit)
{
	var abuse = {}

	var knex = db.knex

	abuse.table = () => knex('abuse_comments')

	var comment_report = notifications_emit('comments_reports')

	abuse.create = function (user_id, comment_id)
	{
		return comments.byId(comment_id)
		.then(Err.nullish(CommentNotExist))
		.then((comment_items) =>
		{
			if (comment_items.user_id === user_id)
			{
				throw YourComments()
			}

			return abuse.table()
			.insert({
				user_id: user_id,
				comment_id: comment_id
			})
		})
		.catch(Err.fromDb('abuse_comments_pkey', AbuseExist))
		.then(() =>
		{
			var data = 
			{
				event: {comment_id: comment_id},
				group: 'admins'
			}

			comment_report(data)
		})
	}

	return abuse
}

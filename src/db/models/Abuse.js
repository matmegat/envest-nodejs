
var Err = require('../../Err')

var CommentNotExist = Err('comment_not_exist', 'Comment not exist')
var AbuseExist = Err('abuse_exist', 'Abuse exist')
var YourComments
  = Err('is_your_comment', 'It is impossible to abuse your comments')


var noop = require('lodash/noop')

module.exports = function Abuse (db, comments, Emitter)
{
	var abuse = {}

	var knex = db.knex

	abuse.table = () => knex('abuse_comments')

	var emitter_options = 
	{
		target: 'group',
		group:  'admins'
	}

	var CommentReport = Emitter('comments_reports', emitter_options)

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
			.then(noop)
		})
		.catch(Err.fromDb('abuse_comments_pkey', AbuseExist))
		.then(() =>
		{
			var event = { comment_id: comment_id }

			return CommentReport(event)
		})
	}

	return abuse
}

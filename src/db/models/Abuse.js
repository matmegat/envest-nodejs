
var Err = require('../../Err')

var _ = require('lodash')
var noop = _.noop

module.exports = function Abuse (db, comments)
{
	var abuse = {}

	var knex = db.knex

	abuse.table = () => knex('abuse_comments')

	var CommentNotExist = Err('comment_not_exist', 'Comment not exist')
	var AbuseExist = Err('abuse_exist', 'Abuse exist')

	abuse.create = function (user_id, comment_id)
	{
		return comments.byId(comment_id)
		.then(Err.nullish(CommentNotExist))
		.then(() =>
		{
			return abuse.table()
			.insert({
				user_id: user_id,
				comment_id: comment_id
			})
			.then(noop)
		})
		.catch(Err.fromDb('abuse_comments_pkey', AbuseExist))
	}

	return abuse
}

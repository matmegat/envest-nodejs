
var toss = require('./toss')
var curry = require('lodash/curry')

module.exports = curry((substr, feature, rq, rs, next) =>
{
	return substr.isAble(rq.user.id, feature)
	.then(() => next(), toss.err(rs))
})

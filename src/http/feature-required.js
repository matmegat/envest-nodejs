
var toss = require('./toss')
var curry = require('lodash/curry')

// eslint-disable-next-line max-params
module.exports = curry((subscr, feature, rq, rs, next) =>
{
	return subscr.isAble(rq.user.id, feature)
	.then(() => next(), toss.err(rs))
})

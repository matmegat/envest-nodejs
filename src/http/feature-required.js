
var toss = require('./toss')
var curry = require('lodash/curry')

var Err = require('../Err')

var FeatureRequired = Err(
'feature_required',
'Feature required for this operation')

// eslint-disable-next-line max-params
module.exports = curry((subscr, feature, rq, rs, next) =>
{
	return subscr.isAble(rq.user.id, feature)
	.then((subscr) =>
	{
		if (! subscr)
		{
			throw FeatureRequired({ feature: feature })
		}
	})
	.then(() => next(), toss.err(rs))
})

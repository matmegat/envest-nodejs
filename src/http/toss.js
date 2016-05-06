
var curry = require('lodash/curry')

var toss = module.exports = curry((rs, data) =>
{
	Promise.resolve(data)
	.then(toss.ok(rs), toss.err(rs))
})

toss.ok = curry((rs, data) =>
{
	return rs.status(200).send(ok)
})

toss.err = curry((rs, err) =>
{
	if (! err.code || ! err.message) console.warn('using wrong error object')

	return rs.status(400).send(err)
})


var curry = require('lodash/curry')
var Err = require('../Err')

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
	if (Err.is(err))
	{
		return rs.status(400).send(err)
	}
	else
	{
		console.warn('using wrong error object')
		console.error(err)

		return rs.status(500).end()
	}
})

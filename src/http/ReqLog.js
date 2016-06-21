
var map = require('lodash/mapValues')

module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		var body = rq.body

		if (rq.originalUrl in fade)
		{
			body = map(body, (value, key) =>
			{
				if (key in secrets)
				{
					return '*'
				}
				else
				{
					return value
				}
			})
		}

		log('%s %s\n%j', rq.method, rq.originalUrl, body)

		next()
	})
}

var fade =
{
	'/api/auth/register': 1,
	'/api/auth/login': 1,
	'/api/password/reset': 1,
	'/api/password/change': 1
}

var secrets =
{
	'password': 1,
	'pass': 1,
	'new_pass': 1
}

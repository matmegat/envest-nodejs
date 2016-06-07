
module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		var body = rq.body

		if (rq.originalUrl in fade)
		{
			body = Object.assign({}, body, { password: '*' })
		}

		log('%s %s\n%j', rq.method, rq.originalUrl, body)

		next()
	})
}

var fade =
{
	'/api/auth/register': 1,
	'/api/auth/login': 1
}

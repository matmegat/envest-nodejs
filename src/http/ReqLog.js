
module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		log('%s %s\n%j', rq.method, rq.originalUrl, rq.body)

		console.log(rq.hostname)
		console.log(rq.get('Content-Type'))

		next()
	})
}


module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		console.log(rq.hostname)
		console.log(rq.get('Content-Type'))

		log('%s %s\n%j', rq.method, rq.originalUrl, rq.body)
		next()
	})
}

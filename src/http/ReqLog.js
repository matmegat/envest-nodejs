
module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		console.log(rq.hostname)

		log('%s %s\n%j', rq.method, rq.originalUrl, rq.body)
		next()
	})
}

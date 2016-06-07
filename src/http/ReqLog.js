
module.exports = function (log, express)
{
	express.use('/api', (rq, rs, next) =>
	{
		log('%s %s\n%j', rq.method, rq.originalUrl, rq.body)

		next()
	})
}

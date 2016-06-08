
module.exports = function (cfg, express)
{
	if (cfg.env === 'dev' || cfg.env === 'test')
	{
		var allowedOrigins =
		[
			'http://127.0.0.1:'  + cfg.port,
			'http://localhost:'  + cfg.port,
			'http://nevest.dev:' + cfg.port,
		]

		express.use((rq, rs, next) =>
		{
			var origin = rq.headers.origin

			if (allowedOrigins.indexOf(origin) > -1)
			{
				rs.setHeader('Access-Control-Allow-Origin', origin)
			}

			rs.header(
				'Access-Control-Allow-Headers',
				'Authorization, Origin, X-Requested-With, Content-Type, Accept, ' +
				'Access-Control-Allow-Credentials'
			)
			rs.header('Access-Control-Allow-Credentials', 'true')

			return next()
		})
	}
}

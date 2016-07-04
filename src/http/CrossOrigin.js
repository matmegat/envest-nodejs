
module.exports = function (cfg, express)
{
	if (cfg.env === 'dev' || cfg.env === 'test')
	{
		var cors = cfg.cors
		var allowed = cors.hosts.map(host =>
		{
			return cors.ports.map(port => host + ':' + port)
		})

		allowed = [].concat.apply([], allowed)

		express.use((rq, rs, next) =>
		{
			var origin = rq.headers.origin

			if (~ allowed.indexOf(origin))
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

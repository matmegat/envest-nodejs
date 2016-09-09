
var flatten = require('lodash/flattenDepth')
var includes = require('lodash/includes')

module.exports = function (cfg, express)
{
	if (cfg.env !== 'prod')
	{
		var cors = cfg.cors
		var allowed = cors.hosts.map(host =>
		{
			return cors.ports.map(port =>
			{
				var r = [ host + ':' + port ]

				if (port === 80)
				{
					r.push(host)
				}

				return r
			})
		})

		var methods =
		[
			'OPTIONS',
			'GET',
			'POST',
			'PUT',
			'DELETE'
		]

		allowed = flatten(allowed, 2)

		express.use((rq, rs, next) =>
		{
			var origin = rq.headers.origin

			if (includes(allowed, origin))
			{
				rs.setHeader('Access-Control-Allow-Origin', origin)
			}

			rs.header(
				'Access-Control-Allow-Headers',

				'Authorization, Origin, X-Requested-With, Content-Type, Accept, ' +
				'Access-Control-Allow-Credentials, Access-Control-Allow-Methods'
			)
			rs.header('Access-Control-Allow-Credentials', 'true')
			rs.header('Access-Control-Allow-Methods', methods.join(', '))

			return next()
		})
	}
}

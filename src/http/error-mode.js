
module.exports = function (config, express)
{
	var mode = Mode(config)

	express.set('env', mode)

	console.info('config: env = %s', config.env)
	console.info('config: dev = %s', config.dev)
	console.info('express mode: %s', mode)
}

function Mode (config)
{
	if (config.dev === false)
	{
		return 'production'
	}
	if (config.env in prods)
	{
		return 'production'
	}

	return 'development'
}

var prods =
{
	prod: true,
	staging: true
}


module.exports = function (config, express)
{
	var mode = Mode(config)

	express.set('env', mode)

	console.info('running app in `%s` mode', mode)
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

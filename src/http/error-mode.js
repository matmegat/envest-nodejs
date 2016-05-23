
module.exports = function (config, express)
{
	var mode 

	if (config.dev === false || config.env === 'prod' || config.env === 'staging')
	{
		mode = 'production'
	}
	else
	{
		mode = 'development'
	}

	console.info('Running app in `%s` mode', mode)
}

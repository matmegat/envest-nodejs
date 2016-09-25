
var get_env = module.exports = (args) =>
{
	var env = args.env

	if (! env)
	{
		console.error('--env must be present')
		process.exit(1)
	}

	return env
}


var pick_env = require('./pick-env')

get_env.remote = (env) =>
{
	try
	{
		var remote_config = pick_env(env)
	}
	catch (e)
	{
		console.error(e.message)
		process.exit(1)
	}

	return remote_config
}


var confirm = require('./confirm')

get_env.confirm = (remote_config, env) =>
{
	return Promise.resolve()
	.then(() =>
	{
		if (remote_config.confirm)
		{
			return confirm.env(env)
		}
		else
		{
			return true
		}
	})
	.then(so =>
	{
		if (! so)
		{
			console.info('STOP')
			process.exit(0)
		}
	})
}

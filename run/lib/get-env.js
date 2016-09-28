
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


get_env.remote = (env) =>
{
	if (env in envs)
	{
		return envs[env]
	}
	else
	{
		console.error('wrong env `' + env + '`')
		process.exit(1)
	}
}

var envs = require('./envs')


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

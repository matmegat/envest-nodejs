
module.exports = (env) =>
{
	if (env in envs)
	{
		return envs[env]
	}
	else
	{
		throw TypeError('wrong env `' + env + '`')
	}
}

var envs = require('./envs')

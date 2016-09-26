
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

var remotes = {}
remotes.devs = 'ec2-52-38-31-214.us-west-2.compute.amazonaws.com'
remotes.prod = 'ec2-52-38-31-214.us-west-2.compute.amazonaws.com'

var envs =
{
	dev:
	{
		remote: remotes.devs
	},
	test:
	{
		remote: remotes.devs
	},
	staging:
	{
		remote: remotes.devs
	},
	prod:
	{
		remote: remotes.devs,
		confirm: true
	},
	virtual:
	{
		remote: '172.17.0.2'
	}
}


var remotes = {}
remotes.devs = 'ec2-35-163-203-21.us-west-2.compute.amazonaws.com'

module.exports =
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
		remote: 'ec2-52-25-63-85.us-west-2.compute.amazonaws.com',
		confirm: true
	},
	perf:
	{
		remote: 'ec2-52-11-126-122.us-west-2.compute.amazonaws.com',
		confirm: true
	}
}

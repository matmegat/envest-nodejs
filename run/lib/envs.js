
var remotes = {}
remotes.devs = 'ec2-52-38-31-214.us-west-2.compute.amazonaws.com'

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
		remote: 'ec2-52-42-79-12.us-west-2.compute.amazonaws.com',
		confirm: true
	},
	perf:
	{
		remote: 'ec2-52-11-126-122.us-west-2.compute.amazonaws.com',
		confirm: true
	}
}

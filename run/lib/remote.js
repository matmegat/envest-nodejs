
module.exports = (env, remote) =>
{
	var r = {}

	r.path = (path) =>
	{
		return 'envest/' + env + '/' + (path || '')
	}

	r.with_user = 'ubuntu@' + remote

	r.target = (path) =>
	{
		return r.with_user + ':' + r.path(path)
	}

	return r
}

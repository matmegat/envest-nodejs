
module.exports = (fn) =>
{
	if (isWithSeed(process.argv))
	{
		return fn()
	}
}

function isWithSeed (argv)
{
	return argv.indexOf('--with-seed') !== -1
}

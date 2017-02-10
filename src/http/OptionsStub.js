
module.exports = function OptionsStub (express)
{
	express.options('/*', (rq, rs) =>
	{
		rs.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS')
		rs.status(200)
		rs.end()
	})
}

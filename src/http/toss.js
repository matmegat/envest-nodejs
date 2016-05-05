
module.exports = function toss (data, rs)
{
	Promise.resolve(data)
	.then(
	ok =>
	{
		rs.status(200).send(ok)
	},
	err =>
	{
		rs.status(400).send(err)
	})
}

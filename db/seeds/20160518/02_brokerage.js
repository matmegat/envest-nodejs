/* eslint-disable no-unreachable */

exports.seed = function (knex)
{
	return /* do not create this one in favor of brokerage-history */

	return knex('brokerage').del()
	.then(() =>
	{
		return knex('investors')
		.select('user_id as id')
	})
	.then((investors) =>
	{
		var brokerage = investors.map((investor) =>
		{
			return {
				investor_id: investor.id,
				cash_value: Math.random() * 50000 + 50000,
				multiplier: Math.random() * 2
			}
		})

		return knex('brokerage').insert(brokerage)
	})
}


exports.seed = function (knex)
{
	return knex('investors').del()
	.then(() =>
	{
		return knex('investors')
		.insert(
		[
			{
				first_name: 'Allen',
				last_name: 'Schwartz'
			},
			{
				first_name: 'Cheyenne',
				last_name: 'Parsons'
			},
			{
				first_name: 'George',
				last_name: 'Masterson'
			},
			{
				first_name: 'Anna',
				last_name: 'Brinkly'
			}
		])
	})
}

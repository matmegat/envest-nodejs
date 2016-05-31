
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
				last_name: 'Schwartz',
				icon: ''
			},
			{
				first_name: 'Cheyenne',
				last_name: 'Parsons',
				icon: ''
			},
			{
				first_name: 'George',
				last_name: 'Masterson',
				icon: ''
			},
			{
				first_name: 'Anna',
				last_name: 'Brinkly',
				icon: ''
			}
		])
	})
}

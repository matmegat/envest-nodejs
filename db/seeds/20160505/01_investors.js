
exports.seed = function (knex)
{
	return knex('investors').del()
	.then(() =>
	{
		return knex('investors')
		.insert(
		[
			{
				full_name: 'Allen Schwartz',
				icon: ''
			},
			{
				full_name: 'Cheyenne Parsons',
				icon: ''
			},
			{
				full_name: 'George Masterson',
				icon: ''
			},
			{
				full_name: 'Anna Brinkly',
				icon: ''
			}
		])
	})
}

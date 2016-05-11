
exports.seed = function (knex, Promise)
{
	return Promise.join(
		// Deletes ALL existing entries
		knex('investors')
		.del(),

		// Inserts seed entries
		knex('investors')
		.insert(
		{
			full_name: 'Allen Schwartz',
			icon: ''
		}),
		knex('investors')
		.insert(
		{
			full_name: 'Cheyenne Parsons',
			icon: ''
		}),
		knex('investors')
		.insert(
		{
			full_name: 'George Masterson',
			icon: ''
		}),
		knex('investors')
		.insert(
		{
			full_name: 'Anna Brinkly',
			icon: ''
		})
	)
}

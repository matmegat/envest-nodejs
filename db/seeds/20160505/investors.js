
exports.seed = function(knex, Promise) {
	return Promise.join(
		// Deletes ALL existing entries
		knex('investors').del(),

		// Inserts seed entries
		knex('investors').insert(
			{
				id: 1,
				full_name: 'Allen Schwartz',
				icon: ''
			}
		),
		knex('investors').insert(
			{
				id: 2,
				full_name: 'Cheyenne Parsons',
				icon: ''
			}
		),
		knex('investors').insert(
			{
				id: 3,
				full_name: 'George Masterson',
				icon: ''
			}
		),
		knex('investors').insert(
			{
				id: 4,
				full_name: 'Anna Brinkly',
				icon: ''
			}
		)
	)
}

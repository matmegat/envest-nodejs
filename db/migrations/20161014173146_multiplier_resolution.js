
exports.up = function (knex)
{
	return Promise.all(
	[
		knex.raw(
			`ALTER TABLE brokerage 
			 ALTER COLUMN multiplier TYPE double precision;`
		)
	])
}

exports.down = function (knex)
{
	return Promise.all(
	[
		knex.raw(`ALTER TABLE brokerage ALTER COLUMN multiplier TYPE real;`)
	])
}

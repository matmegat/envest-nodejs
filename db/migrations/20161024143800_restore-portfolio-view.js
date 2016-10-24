
var create_view = require('../ref/portfolio-current')

exports.up = function (knex)
{
	return knex.schema.raw(`DROP VIEW portfolio_current`)
	.then(() =>
	{
		return knex.schema.raw(create_view('portfolio_prec'))
	})
}

exports.down = function(knex)
{
	return knex.schema.raw(`DROP VIEW portfolio_current`)
	.then(() =>
	{
		return knex.schema.raw(create_view('portfolio'))
	})
}

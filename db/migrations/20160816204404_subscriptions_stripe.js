
exports.up = function (knex)
{
	return knex.schema.table('subscriptions', (table) =>
	{
		table.string('stripe_customer_id').notNullable()
		table.string('stripe_subscriber_id').notNullable()
	})
}

exports.down = function (knex)
{
	return knex.schema.table('subscriptions', (table) =>
	{
		table.dropColumn('stripe_customer_id')
		table.dropColumn('stripe_subscriber_id')
	})
}

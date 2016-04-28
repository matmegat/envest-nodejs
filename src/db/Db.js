
var knex = require('knex')
var Auth = require('./Auth')

module.exports = function name (app)
{
	var db = {}

	var cfg  = app.cfg
	var conn = cfg.pg

	db.knex = knex({
		client: 'pg',
		connection: conn
	})

	db.knex.client.pool.on('error', () =>
	{
		process.exit(1)
	})

	db.ready = Promise.resolve()
	.then(() =>
	{
		return db.knex.select(knex.raw('NOW()'))
	})
	.then(() =>
	{
		return db.knex('email_confirms')
		.select()
		.limit(0)
	})
	.catch(e =>
	{
		console.error(e)
		process.exit(1)
	})
	.then(() =>
	{
		console.info('DB: ok')
	})

	db.auth = Auth(db)
	
	return db
}

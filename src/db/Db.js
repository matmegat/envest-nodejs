
var knex = require('knex')

module.exports = function name (app)
{
	var db = {}

	var cfg  = app.cfg
	var env  = cfg.env
	var conn = cfg.pg[env]

	db.knex = knex({
		client: 'pg',
		connection: conn
	})

	// db.knex('user').select()
	// .then(console.dir)
	// .catch(console.error)

	return db
}

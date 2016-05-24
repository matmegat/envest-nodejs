
var knex = require('knex')

var User = require('./models/User')
var Auth = require('./models/Auth')
var Admin = require('./models/Admin')
var Feed = require('./models/Feed')
var Comments = require('./models/Comments')
var Investor = require('./models/Investor')

module.exports = function name (app)
{
	var db = {}

	var cfg  = app.cfg
	var conn = cfg.pg

	db.helpers = require('./helpers')

	db.knex = knex({
		client: 'pg',
		connection: conn
	})

	db.knex.client.pool.on('error', () =>
	{
		/* we actually can't catch that type of errors */
		/* we can't do anything here */
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
	.then(() =>
	{
		console.info('DB: ok')
	})

	db.user  = User(db)
	db.auth  = Auth(db)
	db.admin = Admin(db)
	db.comments = Comments(db)
	db.investor = Investor(db)
	db.feed = Feed(db)

	return db
}

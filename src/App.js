
var rootpath = require('rootpath')

var Config = require('./Config')
var Log = require('./Log')
var Db = require('./db/Db')
var Http = require('./http/Http')
var Mailer = require('./Mailer')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('package at `%s`', app.root())

	app.cfg  = Config(app)
	app.log  = Log()
	app.mail = Mailer(app)
	app.db   = Db(app)
	app.http = Http(app)

	Promise.all(
	[
		app.db.ready,
		app.http.ready
	])
	.then(() =>
	{
		console.info('READY')
		app.log('READY')
	})
	.catch(error =>
	{
		console.error('NetVest backend init error:')
		console.error(error)
		process.exit(1)
	})

	return app
}

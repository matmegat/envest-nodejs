
var rootpath = require('rootpath')

var Config = require('./Config')
var Db = require('./db/Db')
var Http = require('./http/Http')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('package at `%s`', app.root())

	app.cfg  = Config(app)
	app.db   = Db(app)
	app.http = Http(app)

	Promise.all(
	[
		app.db.ready,
		app.http.ready
	])
	.then(() =>
	{
		console.info('NetVest backend at :%s', app.cfg.port)
	})

	return app
}

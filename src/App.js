
var rootpath = require('rootpath')

var Config = require('./Config')
var Db = require('./db/Db')
var Http = require('./api/Http')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('Running at `%s`', app.root())

	app.cfg = Config(app)

	app.db = Db(app)

	app.http = Http(app)

	return app
}

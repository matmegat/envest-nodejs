
var rootpath = require('rootpath')

var Config = require('./Config')
var Http = require('./api/Http')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('Running at `%s`', app.root())

	app.cfg = Config(app)

	app.http = Http(app)

	return app
}

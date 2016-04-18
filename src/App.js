
var rootpath = require('rootpath')

var Http = require('./api/Http')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('Running at `%s`', app.root())

	app.http = Http(app)

	return app
}

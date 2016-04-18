
var Http = require('./api/Http')

module.exports = function App ()
{
	var app = {}

	app.http = Http(app)

	return app
}

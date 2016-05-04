
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var Feed = require('./api/Feed')
var Auth = require('./api/Auth')
var Passport = require('./Passport')

module.exports = function Http (app)
{
	var http = {}

	http.express = express()

	http.express.use(cookie_parser())
	http.express.use(body_parser.json())

	http.express.use('/api', (rq, rs, next) =>
	{
		console.info('%s %s', rq.method, rq.originalUrl)
		console.log(rq.body)
		next()
	})

	http.passport = Passport(http.express, app.db)

	http.api = {}

	function mount (subsystem, route, name)
	{
		http.api[name] = subsystem

		route = '/api/' + route
		http.express.use(route, subsystem.express)

		console.info('API: mount %s at %s', name, route)
	}

	mount(Feed(), 'feed', 'feed')
	mount(Auth(app.db.auth, http.passport), 'auth', 'auth')

	if (app.cfg.env !== 'prod')
	{
		/* eslint-disable max-len */
		// didn't find declaration of using 'body' schema of parameters
		// swagger.io/specification/#parameterObject
		// github.com/apigee-127/swagger-tools/blob/master/schemas/2.0/schema.json#L887-L908
		// http.express.use(body_parser.urlencoded({ extended: true }))
		/* eslint-enable */
		require('./Swagger')(app, http.express)
	}

	var port = app.cfg.port

	http.ready = new Promise(rs =>
	{
		http.express.listen(port, rs)
	})

	return http
}

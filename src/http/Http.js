
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var compose = require('composable-middleware')
var authRequired = require('./auth-required')
var AdminRequired = require('./admin-required')

var Feed = require('./api/feed/Feed')
var Auth = require('./api/auth/Auth')
var Comments = require('./api/comments/Comments')
var Passport = require('./Passport')
var Swagger = require('./Swagger')

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

	http.adminRequired = compose(authRequired, AdminRequired(app.db.admin))
	http.passport = Passport(http.express, app.db)

	http.api = {}

	function mount (subsystem, route, name)
	{
		http.api[name] = subsystem

		route = '/api/' + route
		http.express.use(route, subsystem.express)

		console.info('API: mount %s at %s', name, route)
	}

	mount(Feed(app.db), 'feed', 'feed')
	mount(Comments(app.db.comments), 'comments', 'comments')
	mount(Auth(app.db.auth, http.passport), 'auth', 'auth')

	app.swagger = Swagger(app, http.express)

	var port = app.cfg.port

	http.ready = Promise.all(
	[
		new Promise(rs =>
		{
			http.express.listen(port, rs)
		})
		.then(() =>
		{
			console.info('http at :%s', app.cfg.port)
		}),

		app.swagger
	])

	return http
}

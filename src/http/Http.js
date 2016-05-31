
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var compose = require('composable-middleware')
var authRequired = require('./auth-required')
var AdminRequired = require('./admin-required')

var Feed = require('./api/feed/Feed')
var Auth = require('./api/auth/Auth')
var Comments = require('./api/comments/Comments')
var Investors = require('./api/investors/Investors')
var Statics = require('./api/statics/Statics')
var Passport = require('./Passport')
var Swagger = require('./Swagger')

var errorMiddleware = require('./error-middleware')
var setErrorMode = require('./error-mode')

module.exports = function Http (app)
{
	var http = {}

	http.express = express()

	setErrorMode(app.cfg, http.express)

	http.express.use(cookie_parser())
	http.express.use(body_parser.json())


	if (app.cfg.env === 'dev' || app.cfg.env === 'test')
	{
		http.express.use((rq, rs, next) =>
		{
			var allowedOrigins =
			[
				'http://127.0.0.1:' + app.cfg.port,
				'http://localhost:' + app.cfg.port,
				'http://nevest.dev:' + app.cfg.port,
			]
			var origin = rq.headers.origin

			if (allowedOrigins.indexOf(origin) > -1)
			{
				rs.setHeader('Access-Control-Allow-Origin', origin)
			}
			rs.header(
				'Access-Control-Allow-Headers',
				'Origin, X-Requested-With, Content-Type, Accept'
			)

			return next()
		})
	}

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
	mount(Investors(app.db), 'investors', 'investors')
	mount(Statics(app.root), 'static', 'static')

	http.express.use(errorMiddleware)

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

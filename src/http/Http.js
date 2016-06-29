
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var compose = require('composable-middleware')
var authRequired = require('./auth-required')
var AdminRequired = require('./admin-required')

var Auth = require('./api/auth/Auth')
var Admin = require('./api/admin/Admin')
var Password = require('./api/password/Password')

var Feed = require('./api/feed/Feed')
var Comments = require('./api/comments/Comments')
var Investors = require('./api/investors/Investors')
var Watchlist = require('./api/watchlist/Watchlist')

var Statics = require('./api/statics/Statics')

var Notifications = require('./api/notifications/Notifications')

var Passport = require('./Passport')
var Swagger = require('./Swagger')
var CrossOrigin = require('./CrossOrigin')
var ReqLog = require('./ReqLog')
var CheckToken = require('./CheckToken')
var OptionsStub = require('./OptionsStub')

var errorMiddleware = require('./error-middleware')
var setErrorMode = require('./error-mode')

module.exports = function Http (app)
{
	var http = {}

	http.express = express()

	setErrorMode(app.cfg, http.express)

	http.express.use(cookie_parser())
	http.express.use(body_parser.json())

	CrossOrigin(app.cfg, http.express)

	ReqLog(app.log, http.express)

	http.adminRequired = compose(authRequired, AdminRequired(app.db.admin))
	http.passport = Passport(http.express, app.db)

	CheckToken(http.express, http.passport)

	OptionsStub(http.express)


	http.api = {}

	function mount (subsystem, route, name)
	{
		http.api[name] = subsystem

		route = '/api/' + route
		http.express.use(route, subsystem.express)

		console.info('API: mount %s at %s', name, route)
	}

	mount(Auth(app.db.auth, http.passport), 'auth', 'auth')
	mount(Admin(http, app.db.admin), 'admin', 'admin')
	mount(Feed(app.db), 'feed', 'feed')
	mount(Comments(app.db.comments), 'comments', 'comments')
	mount(Investors(app.db, http), 'investors', 'investors')
	mount(Statics(app.root), 'static', 'static')
	mount(Notifications(app.db), 'notifications', 'notifications')
	mount(Password(app.db.user), 'password', 'password')
	mount(Watchlist(), 'watchlist', 'watchlist')


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

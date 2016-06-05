
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var compose = require('composable-middleware')
var authRequired = require('./auth-required')
var AdminRequired = require('./admin-required')

var Auth = require('./api/auth/Auth')
var Admin = require('./api/admin/Admin')

var Feed = require('./api/feed/Feed')
var Comments = require('./api/comments/Comments')
var Investors = require('./api/investors/Investors')

var Statics = require('./api/statics/Statics')

var Passport = require('./Passport')
var Swagger = require('./Swagger')
var CrossOrigin = require('./CrossOrigin')
var ReqLog = require('./ReqLog')

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

	http.api = {}

	function mount (subsystem, route, name)
	{
		http.api[name] = subsystem

		route = '/api/' + route
		http.express.use(route, subsystem.express)

		console.info('API: mount %s at %s', name, route)
	}

	http.express.use((rq, rs, next) =>
	{
		var token = rq.get('Authorization')

		if (token)
		{
			// @todo: deal with function repeat
			http.passport.authenticate('bearer',
				{ session: false },
				(err, user, info) =>
			{
				if (err)
				{
					return next(err)
				}

				rq.login(user, function (err)
				{
					if (err)
					{

						if (info)
						{
							err.message = info.message
						}

						return next(err)
					}

					next()
				})
			})(rq, rs, next)
		}
		else
		{
			next()
		}
	})

	mount(Auth(app.db.auth, http.passport), 'auth', 'auth')
	mount(Admin(http, app.db.admin), 'admin', 'admin')
	mount(Feed(app.db), 'feed', 'feed')
	mount(Comments(app.db.comments), 'comments', 'comments')
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

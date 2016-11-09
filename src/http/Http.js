
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var compose = require('composable-middleware')
var authRequired = require('./auth-required')
var AdminOrOwnerRequired = require('./admin-or-user-required')
var AdminRequired = require('./admin-required')
var featureRequired = require('./feature-required')
var investorRequired = require('./investor-required')

var Auth = require('./api/auth/Auth')
var Admin = require('./api/admin/Admin')
var Password = require('./api/password/Password')
var Users = require('./api/users/Users')
var Subscr = require('./api/subscr/Subscr')
var Promo = require('./api/promo/Promo')
var Statistics = require('./api/statistics/Statistics')

var Feed = require('./api/feed/Feed')
var Comments = require('./api/comments/Comments')
var Investors = require('./api/investors/Investors')
var Watchlist = require('./api/watchlist/Watchlist')

var Statics = require('./api/statics/Statics')

var Feedback = require('./api/feedback/Feedback')

var Notifications = require('./api/notifications/Notifications')

var Symbols = require('./api/symbols/Symbols')

var Passport = require('./Passport')
var Swagger = require('./Swagger')
var CrossOrigin = require('./CrossOrigin')
var ReqLog = require('./ReqLog')
var CheckToken = require('./CheckToken')
var OptionsStub = require('./OptionsStub')

var internalError = require('./internal-error')
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

	http.adminOrInvestorRequired =
		compose(
			authRequired,
			AdminOrOwnerRequired(app.db.investor.all, app.db.admin)
		)

	http.adminRequired = compose(authRequired, AdminRequired(app.db.admin))
	http.featureRequired = featureRequired(app.db.subscr)
	http.investorRequired =
		compose(authRequired, investorRequired(app.db.investor))
	http.passport = Passport(http.express, app.db)

	CheckToken(http.express, http.passport)

	OptionsStub(http.express)

	http.express.get('/detect-device', (rq, rs) =>
	{
		var file = require('fs').createReadStream

		file(app.root('static/detect-device.html')).pipe(rs)
	})
	http.express.get('/reset-password', (rq, rs) =>
	{
		var file = require('fs').createReadStream

		file(app.root('static/reset-password.html')).pipe(rs)
	})
	http.express.get('/confirm-email', (rq, rs) =>
	{
		var file = require('fs').createReadStream

		file(app.root('static/confirm-email.html')).pipe(rs)
	})

	http.api = {}

	var api_prefix = '/api/'

	http.express.get(api_prefix, (rq, rs) =>
	{
		rs.send({ netvest: true })
	})

	function mount (subsystem, route, name)
	{
		http.api[name] = subsystem

		route = api_prefix + route
		http.express.use(route, subsystem.express)
	}

	mount(Auth(app.db.auth, http.passport), 'auth', 'auth')
	mount(Admin(app.db, http, app.db.admin), 'admin', 'admin')
	mount(Feed(app.db, http), 'feed', 'feed')
	mount(Comments(app.db.comments), 'comments', 'comments')
	mount(Investors(app.db, http), 'investors', 'investors')
	mount(Statics(app.root, app.db, http), 'static', 'static')
	mount(Notifications(app.db), 'notifications', 'notifications')
	mount(Password(app.db.user), 'password', 'password')
	mount(Users(http, app.db.user), 'users', 'users')
	mount(Watchlist(app.db.watchlist, http), 'watchlist', 'watchlist')
	mount(Subscr(app.db.subscr), 'subscr', 'subscr')
	mount(Promo(http, app.db.subscr), 'promo', 'promo')
	mount(Symbols(app.db.symbols), 'symbols', 'symbols')
	mount(Feedback(app.db, app.cfg.feedback.email), 'feedback', 'feedback')
	mount(Statistics(app.db, http), 'statistics', 'statistics')


	http.express.use(internalError)

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
			console.info(`HTTP at ${app.cfg.host}:${app.cfg.port}`)
		}),

		app.swagger
	])
	.then(() =>
	{
		console.info('HTTP: ok')
	})

	return http
}

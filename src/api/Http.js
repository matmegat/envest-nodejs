
var express = require('express')
var body_parser = require('body-parser')
var cookie_parser = require('cookie-parser')

var Feed = require('./Feed')
var Auth = require('./Auth')
var Passport = require('../Passport')

module.exports = function Http (app)
{
	var http = {}

	http.express = express()
	http.express.use(cookie_parser())
	http.express.use(body_parser.json())

	http.passport = Passport(http.express, app.db.auth)

	http.feed = Feed()
	http.express.use('/api/feed', http.feed.express)

	http.auth = Auth(app.db, http.passport)
	http.express.use('/api/auth', http.auth.express)

	var port = app.cfg.port

	http.express.listen(port, () => console.info('NetVest backend at :%s', port))

	return http
}

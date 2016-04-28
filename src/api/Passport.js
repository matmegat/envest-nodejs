
var session = require('express-session')
var secret  = 'aoor91xck0'

var passport = require('passport')
var LocalStrategy = require('passport-local')

module.exports = function (express, auth)
{
	express.use(session(
	{
		name:  'sid',
		secret: secret,
		resave: false,
		saveUninitialized: false
	}))

	express.use(passport.initialize())
	express.use(passport.session())

	passport.serializeUser((user, done) =>
	{
		done(null, user.id)
	})

	passport.deserializeUser((id, done) =>
	{
		auth.byId(id)
		.then(user =>
		{
			done(null, user)
		}
		, done)
	})

	useLocal(auth)

	return passport
}

function useLocal (auth)
{
	passport.use(new LocalStrategy(
	{
		usernameField: 'email',
		passwordField: 'password',
	}
	, (username, password, done) =>
	{
		auth.login(username, password, done)
		.catch(error =>
		{
			return done(error)
		})
	}))
}

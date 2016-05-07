
var session = require('express-session')
var secret  = 'aoor91xck0'

var passport = require('passport')
var LocalStrategy = require('passport-local')

module.exports = function (express, db)
{
	var user = db.user
	var auth = db.auth

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
		user.byId(id)
		.then(user =>
		{
			if (! user)
			{
				user = false
			}
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
	, (email, password, done) =>
	{
		auth.login(email, password)
		.then(user_data => done(null, user_data), done)
	}))
}

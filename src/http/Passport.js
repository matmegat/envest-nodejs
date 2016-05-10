
var session = require('express-session')
var secret  = 'aoor91xck0'

var passport = require('passport')
var LocalStrategy = require('passport-local')
var FacebookTokenStrategy = require('passport-facebook-token')

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
	useFacebookToken(auth, user)

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

var clientID = 213309782384928
var clientSecret = '7bb071d47fb514268d2d3e26edca4c57'

function useFacebookToken (auth, user)
{
	passport.use(new FacebookTokenStrategy(
	{
		clientID: clientID,
		clientSecret: clientSecret
	}
	, (accessToken, refreshToken, profile, done) =>
	{
		var user_data =
		{
			email: profile.emails[0].value,
			full_name: `${profile.name.givenName} ${profile.name.familyName}`,
			facebook_id: profile.id,
			token: accessToken
		}

		user.findOrCreate(user_data)
		.then(user => done(null, user), done)
	}))
}


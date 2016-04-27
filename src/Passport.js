
const passport = require('passport')
const session = require('express-session')

const LocalStrategy = require('passport-local').Strategy

module.exports = function (express, db)
{
	var auth_model = require('./db/Auth')(db)

	express.use(session(
	{
		name: 'sid',
		secret: 'aoor91xck0',
		resave: false,
		saveUninitialized: true
	}))

	express.use(passport.initialize())
	express.use(passport.session())

	passport.serializeUser((user, done) =>
	{
	  done(null, user.id);
	});

	passport.deserializeUser((id, done) =>
	{
	  model.get_by_id(id)
	  .then((user) =>
	  {
	  	done(null, user)
	  })
	});

	init_local_strat(auth_model)

	return passport
}

function init_local_strat (model)
{
	passport.use(new LocalStrategy(
	{
		usernameField: 'email',
		passwordField: 'password'
	}, (username, password, done) =>
	{
		model.select_user(username)
		.then((user) =>
		{
			if (user)
			{
				model.helpers.encrypt_pass(password)
				.then(password =>
				{
					if (password === user.password)
					{
						done(null, user)
					}
					else
					{
						done(null, false, { message: 'Incorrect password.' })
					}
				})
			}
			else
			{
				done(null, false, { message: 'Incorrect username.' })
			}
		})
		.catch(error =>
		{
			done(error)
		})
	}))
}

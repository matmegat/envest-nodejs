const router = require('express').Router

module.exports = function Auth (db, passport)
{
	var auth = {}

	auth.model = require('../db/Auth')(db)
	auth.express = router()

	auth.express.post('/register', (req, res) =>
	{
		var data = req.body
		var user_data = {
			first_name: data.first_name,
			last_name: data.last_name,
			email: data.email,
			password: data.password
		}

		auth.model.register(user_data)
		.then(() =>
		{
			res.sendStatus(200)
		})
		.catch(error =>
		{
			res.status(500).send(error)
		})
	})

	auth.express.post('/login', (req, res, next) =>
	{
		passport.authenticate('local', (err, user, info) =>
		{
			if (err) { return next(err) }
			if (! user)
			{
				var message = 'Authentication error'

				if (info)
				{
					message = info.message
				}

				return res.sendStatus(401)
			}
			req.logIn(user, function (err)
			{
			    if (err) { return next(err) }

			    return res.sendStatus(200)
			})
		})(req, res, next)
	})

	auth.express.post('/session-check', (req, res) =>
	{
		console.log('user:')
		console.log(req.user)
		console.log(req.isAuthenticated())
		res.sendStatus(200)
	})

	auth.express.get('/logout', (req, res) =>
	{
		req.logout()
		res.sendStatus(200)
	})

	return auth
}

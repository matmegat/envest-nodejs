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
			//if (err) { return next(err) }
			if (! user)
			{
				var message = 'Authentication error'

				if (info)
				{
					message = info.message
				}

				res.status(401).send(message)
			}
			req.logIn(user, function ()
			{
			    //if (err) { return next(err) }
			    return res.sendStatus(200)
			})
		})(req, res, next)
	})

	auth.express.get('/logout', (req, res) =>
	{
		req.logout()
		res.sendStatus(200)
	})

	return auth
}

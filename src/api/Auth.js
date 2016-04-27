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

	auth.express.post('/login', (req, res) =>
	{
		var data = req.body

		passport.authenticate('local', { failureFlash: 'Invalid username or password.' }, function (req, res)
		{
			res.sendStatus(200)
		})
	})

	auth.express.get('/logout', function (req, res)
	{
	  req.logout()
	  res.sendStatus(200)
	});

	auth.express.get('/logout', (req, res) =>
	{
		req.logout()
		res.sendStatus(200)
	})

	return auth
}

const router = require('express').Router

module.exports = function Auth (db)
{
	var auth = {}
	auth.model = require('../db/Auth')(db)
	auth.express = router()

	auth.express.post('/register', (req, res) =>
	{
		var data = req.body

		auth.model.register(data.first_name, data.last_name, data.email, data.password)
		.then(() => {
			res.sendStatus(200)
		})
		.catch(error => {
			res.status(500).send(error)
		})
	})

	auth.express.post('/login', (req, res) =>
	{
		var data = req.body

		var email = data.email
		var password = data.password

		res.json(data)
	})

	auth.express.get('/logout', (req, res) =>
	{
		req.logout()
		res.sendStatus(200)
	})

	return auth
}


var Router = require('express').Router

module.exports = function Auth (auth_model, passport)
{
	var auth = {}

	auth.model = auth_model
	auth.express = Router()

	auth.express.post('/register', (rq, rs) =>
	{
		var data = rq.body
		var user_data =
		{
			first_name: data.first_name,
			last_name: data.last_name,
			email: data.email,
			password: data.password
		}

		auth.model.register(user_data)
		.then(() =>
		{
			rs.sendStatus(200)
		})
		.catch(error =>
		{
			rs.status(500).send(error)
		})
	})

	auth.express.post('/login', (rq, rs, next) =>
	{
		passport.authenticate('local', (err, user) =>
		{
			if (err) { return next(err) }

			if (! user)
			{
				return rs.sendStatus(401)
			}

			rq.login(user, function (err)
			{
				if (err) { return next(err) }

				return rs.sendStatus(200)
			})
		})(rq, rs, next)
	})

	auth.express.post('/session-check', (rq, rs) =>
	{
		console.log('user:')
		console.log(rq.user)
		console.log(rq.isAuthenticated())
		rs.sendStatus(200)
	})

	auth.express.get('/logout', (rq, rs) =>
	{
		rq.logout()
		rs.sendStatus(200)
	})

	return auth
}

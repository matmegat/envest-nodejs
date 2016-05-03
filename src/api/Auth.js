
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
		.then((id) =>
		{
			user_data.id = id[0]
			delete user_data.password

			rs.status(200)
			.set('access-token', 'will be here')
			.set('token-type', 'bearer')
			.send(user_data)
		})
		.catch(error =>
		{
			if (error.constraint === 'users_email_unique')
			{
				return rs.status(403).send(
				{
					status: false,
					message: 'User with this email already exists'
				})
			}

			return rs.status(500).send(
			{
				status: false,
				message: error.message
			})
		})
	})

	auth.express.post('/login', (rq, rs, next) =>
	{
		passport.authenticate('local', (err, user) =>
		{
			if (err) { return next(err) }

			if (! user)
			{
				return rs.status(401).send(
				{
					status: false,
					message: 'Email and password doesn\'t match'
				})
			}

			rq.login(user, function (err)
			{
				if (err) { return next(err) }

				return rs
				.status(200)
				.set('access-token', 'will be here')
				.set('token-type', 'bearer')
				.send(user)
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

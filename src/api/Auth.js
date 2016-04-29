
var Router = require('express').Router
var merge = require('lodash/merge')

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
			rs.status(200).send(merge(user_data,
			{
				id: id,
				password: null
			}))
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

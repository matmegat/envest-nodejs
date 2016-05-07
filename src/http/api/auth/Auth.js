
var pick = require('lodash/pick')

var Router = require('express').Router

var Err  = require('../../../Err')
var toss = require('../../toss')

module.exports = function Auth (auth_model, passport)
{
	var auth = {}

	auth.model = auth_model
	auth.express = Router()

	auth.express.post('/register', (rq, rs) =>
	{
		var user_data = pick(rq.body,
		[
			'full_name',
			'email',
			'password'
		])

		auth.model.register(user_data)
		.then(id =>
		{
			var login_data =
			{
				id: id,
				email: user_data.email,
				full_name: user_data.full_name
			}

			rq.login(login_data, err =>
			{
				if (err)
				{
					return rs.status(500).send(
					{
						status: false,
						message: 'Login failed'
					})
				}
				else
				{
					rs.status(200).send({})
				}
			})
		})
		.catch(toss.err(rs))
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
				.send(user)
			})
		})(rq, rs, next)
	})

	auth.express.post('/confirm-email', (rq, rs) =>
	{
		var code = rq.body.code

		auth.model.emailConfirm(code)
		.then((data) =>
		{
			rs.status(200)
			.send(data)
		})
	})

	auth.express.post('/logout', (rq, rs) =>
	{
		rq.logout()
		rs.sendStatus(200)
	})

	return auth
}

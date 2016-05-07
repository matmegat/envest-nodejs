
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
			return auth.model.login(user_data.email, user_data.password)
		})
		.then(user_data =>
		{
			rq.login(user_data, err =>
			{
				if (err)
				{
					return toss.err(rs, err)
				}
				else
				{
					rs.status(200).send(user_data)
				}
			})
		})
		.catch(toss.err(rs))
	})

	auth.express.post('/login', (rq, rs, next) =>
	{
		passport.authenticate('local', (err, user) =>
		{
			if (err)
			{
				return toss.err(rs, err)
			}

			rq.login(user, function (err)
			{
				/* ¯\_(ツ)_/¯ */
				if (err) { return next(err) }

				return rs.status(200).send(user)
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
		rs.status(200).end()
	})

	return auth
}

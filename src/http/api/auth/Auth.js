
var pick = require('lodash/pick')

var Router = require('express').Router

var authRequired = require('../../auth-required')
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
		.then(() =>
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
					return toss.ok(rs, user_data)
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

				return toss.ok(rs, user)
			})
		})(rq, rs, next)
	})

	// todo remove copypasta

	auth.express.post('/facebook', (rq, rs, next) =>
	{
		passport.authenticate('facebook-token', (err, user) =>
		{
			if (err)
			{
				return toss.err(rs, err)
			}

			rq.login(user, function (err)
			{
				if (err) { return next(err) }

				return toss.ok(rs, user)
			})
		})(rq, rs, next)
	})

	auth.express.post('/confirm-email', (rq, rs) =>
	{
		var code = rq.body.code

		toss(rs, auth.model.emailConfirm(code))
	})

	auth.express.post('/change-email', authRequired, (rq, rs) =>
	{
		var email   = rq.body.email
		var user_id = rq.user.id

		toss(rs, auth.model.changeEmail(user_id, email))
	})

	auth.express.post('/logout', authRequired, (rq, rs) =>
	{
		rq.logout()
		rs.status(200).end()
	})

	return auth
}

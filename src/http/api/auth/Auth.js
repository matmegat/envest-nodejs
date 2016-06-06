
var expect = require('chai').expect

var pick = require('lodash/pick')
var curry = require('lodash/curry')

var Router = require('express').Router

var authRequired = require('../../auth-required')
var toss = require('../../toss')

module.exports = function Auth (db, passport)
{
	var auth = {}

	expect(db, 'api/Auth depends on Pic').property('pic')
	var pic_decorator = db.pic.decorate('pic')

	auth.model = db.auth
	auth.express = Router()

	auth.express.post('/register', (rq, rs) =>
	{
		var hostname = rq.hostname

		var user_data = pick(rq.body,
		[
			'first_name',
			'last_name',
			'email',
			'password'
		])

		auth.model.register(user_data)
		.then(() =>
		{
			return auth.model.login(user_data.email, user_data.password)
		})
		.then(pic_decorator(hostname))
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

	// eslint-disable-next-line max-params
	var authByProvider = curry((provider, rq, rs, next) =>
	{
		var hostname = rq.hostname

		passport.authenticate(provider, (err, user, info) =>
		{
			if (err)
			{
				return next(err)
			}

			rq.login(user, function (err)
			{
				if (err)
				{

					if (info)
					{
						err.message = info.message
					}

					return next(err)
				}

				user = pic_decorator(hostname, user)

				return toss.ok(rs, user)
			})
		})(rq, rs, next)
	})

	var checkAuthCreds = function (rq, rs, next)
	{
		var email = rq.body.email
		var password = rq.body.password

		auth.model.validateLogin(email, password)
		.then(() =>
		{
			next()
		}
		, toss.err(rs))
	}

	auth.express.post('/login', checkAuthCreds, authByProvider('local'))

	auth.express.post('/login/facebook', authByProvider('facebook-token'))

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

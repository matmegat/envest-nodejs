
module.exports = function (express, passport)
{
	express.use((rq, rs, next) =>
	{
		var token = rq.get('Authorization')

		if (token)
		{
			// @todo: deal with function repeat
			passport.authenticate('bearer',
				{ session: false },
				(err, user, info) =>
			{
				if (err)
				{
					return next(err)
				}

				if(! user)
				{
					return next()
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

					next()
				})
			})(rq, rs, next)
		}
		else
		{
			next()
		}
	})
}

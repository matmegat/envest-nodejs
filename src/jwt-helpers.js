var jwt = require('jsonwebtoken')

var token_secret = 'asd93vzz21000dfs'

var helpers = module.exports = {}

helpers.generate = function generate_token (user)
{
	return jwt.sign({ id: user.id }, token_secret)
}

helpers.verify = function verify_token (token)
{
	return jwt.verify(token, token_secret)
}

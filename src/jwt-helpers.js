var jwt = require('jsonwebtoken')

var token_secret = 'asd93vzz21000dfs'

var helpers = module.exports = {}

helpers.generate_token = function generate_token (user)
{
	return jwt.sign({ id: user.id }, token_secret)
}

helpers.verify_token = function verify_token (token)
{
	return jwt.verify(token, token_secret)
}

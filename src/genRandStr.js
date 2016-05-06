
var crypto    = require('crypto')
var promisify = require('promisify-node')
var method    = require('lodash/method')

var randomBytes = promisify(crypto.randomBytes)
var hex = method('toString', 'hex')

module.exports = function genRandStr (length)
{
	return randomBytes(length)
	.then(hex)
}

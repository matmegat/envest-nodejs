
var confirmer = require('inquirer-confirm')

var confirm = module.exports = function confirm (message)
{
	return confirmer(message)
	.then(() => true, () => false)
}

confirm.env = (env) =>
{
	return confirm(`env = ${env}. continue?`)
}

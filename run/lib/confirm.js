
var confirm = require('inquirer-confirm')

module.exports = (message) =>
{
	return confirm(message)
	.then(() => true, () => false)
}

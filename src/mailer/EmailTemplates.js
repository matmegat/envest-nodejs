
module.exports =
{
	emailConfirm: (substitutions) =>
	{
		return {
			subject: 'Almost there!',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `We’re glad you’re joining us. There’s one more step before you can `
			+ `follow our Netvestors - please click `
			+ `<a href="http://${substitutions.host}/`
			+ `confirm-email?code=${substitutions.code}">here</a> to confirm your `
			+ `email address.<br><br>`
			+ `Invest on,<br>`
			+ `Team Netvest`
		}
	},

	resetPassword: (substitutions) =>
	{
		return {
			subject: 'Reset your Netvest password',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `Forgot your password? It happens to the best of us. `
			+ `Just click <a href="http://${substitutions.host}/`
			+ `reset-password?code=${substitutions.code}">here</a> to reset `
			+ `your password and get back in the mix with your favorite `
			+ `Netvestors.<br><br>`
			+ `Invest on,<br>`
			+ `Team Netvest`
		}
	},
}

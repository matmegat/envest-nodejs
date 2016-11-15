
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
			+ `confirm-email?code=${substitutions.confirm_code}">here</a> to `
			+ `confirm your email address.<br><br>`
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
			+ `reset-password?code=${substitutions.password_code}">here</a> to `
			+ `reset your password and get back in the mix with your favorite `
			+ `Netvestors.<br><br>`
			+ `Invest on,<br>`
			+ `Team Netvest`
		}
	},

	trialExpired: (substitutions) =>
	{
		return {
			subject: `What did you decide, ${substitutions.first_name}?`,
			html: `We knew this day would come eventually: your Netvest trial `
			+ `membership has ended.<br><br>`
			+ `Want to keep the Netvestors around for the good and bad markets?`
			+ ` Just log into your account on our `
			+ `<a href="${substitutions.website_link}">website</a> and follow `
			+ `the instructions to keep your membership. It’s only $25 a month,`
			+ `and we make it easy to cancel anytime.<br><br>`
			+ `Not convinced yet? Do us a solid and tell us why before you `
			+ `leave. We’re always looking for ways to improve.<br>`
			+ `<a href="${substitutions.feedback_link}">Share your thoughts</a>`
			+ `<br><br>`
			+ `Invest on,<br>`
			+ `Team Netvest`
		}
	}
}


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
	},

	userDeleted: (substitutions) =>
	{
		return {
			admin:
			{
				subject: `You have deleted a user.`,
				html: `The user <strong><em>${substitutions.user_email}</em>`
				+ `</strong> has successfully been deleted.<br><br>`
				+ `Team Netvest`
			},
			user:
			{
				subject: `Goodbye, ${substitutions.first_name}.`,
				html: `Goodbye, ${substitutions.first_name}.<br><br>`
				+ `We know you "${substitutions.reason_text}", but if you `
				+ `change your mind, ${substitutions.contact_email} `
				+ `we’ll be here.`
			}
		}
	},

	userWelcome: (substitutions) =>
	{
		return {
			subject: 'Welcome to Netvest',
			html: `Hi, ${substitutions.first_name},<br><br>`
			+ `Thank you for joining the Netvest beta testing period. We are ex`
			+ `cited to hear your feedback and impressions of the Netvest exper`
			+ `ience. If you have not already done so, please download the app `
			+ `on <a href="${substitutions.ios_beta_app}">iOS</a> or `
			+ `<a href="${substitutions.android_beta_app}">Android</a> to get s`
			+ `tarted. You will receive a separate email containing a user guid`
			+ `e with directions for app installation and launch.<br><br>`
			+ `If you have any questions, please `
			+ `<a href="mailto:${substitutions.contact_email}">reach out</a>.`
			+ `<br><br>`
			+ `Thank you!<br>`
			+ `Team Netvest`
		}
	},

	investorWelcome: (substitutions) =>
	{
		return {
			subject: 'Welcome to Netvest',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `Your Netvest author account is now live. Click `
			+ `<a href="http://${substitutions.host}/admin/">here</a> to manage`
			+ ` your profile, log portfolio activity, and post blogs. On your `
			+ `first visit, you’ll be asked to set a password for your account.`
			+ ` Keep your password in a secure place.<br><br>`
			+ `If you have any questions, please `
			+ `<a href="mailto:claudette@netvest.com">reach out</a>.<br><br>`
			+ `Thank you!<br>`
			+ `Team Netvest`
		}
	},

	feedback: (substitutions) =>
	{
		return {
			subject: `Feedback from ${substitutions.user_email}`,
			html: `${substitutions.feedback_text}`
		}
	}
}

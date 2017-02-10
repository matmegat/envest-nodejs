
module.exports =
{
	emailConfirm: (substitutions) =>
	{
		return {
			subject: 'Almost there!',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `We’re glad you’re joining us. There’s one more step before you can `
			+ `follow our Envestors - please click `
			+ `<a href="http://${substitutions.host}/`
			+ `confirm-email?code=${substitutions.confirm_code}">here</a> to `
			+ `confirm your email address.<br><br>`
			+ `Invest on,<br>`
			+ `Team Envest`
		}
	},

	resetPassword: (substitutions) =>
	{
		return {
			subject: 'Reset your Envest password',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `Forgot your password? It happens to the best of us. `
			+ `Just click <a href="http://${substitutions.host}/`
			+ `reset-password?code=${substitutions.password_code}">here</a> to `
			+ `reset your password and get back in the mix with your favorite `
			+ `Envestors.<br><br>`
			+ `Invest on,<br>`
			+ `Team Envest`
		}
	},

	trialExpired: (substitutions) =>
	{
		return {
			subject: `What did you decide, ${substitutions.first_name}?`,
			html: `We knew this day would come eventually: your Envest trial `
			+ `membership has ended.<br><br>`
			+ `Want to keep the Envestors around for the good and bad markets?`
			+ ` Just log into your account on our `
			+ `<a href="${substitutions.website_link}">website</a> and follow `
			+ `the instructions to keep your membership. It’s only $25 a month,`
			+ `and we make it easy to cancel anytime.<br><br>`
			+ `Not convinced yet? Do us a solid and tell us why before you `
			+ `leave. We’re always looking for ways to improve.<br>`
			+ `<a href="${substitutions.feedback_link}">Share your thoughts</a>`
			+ `<br><br>`
			+ `Invest on,<br>`
			+ `Team Envest`
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
				+ `Team Envest`
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
			subject: 'Welcome to Envest',
			html: `Hi, ${substitutions.first_name},<br><br>`
			+ `Thank you for joining the Envest beta testing period. We are ex`
			+ `cited to hear your feedback and impressions of the Envest exper`
			+ `ience. If you have not already done so, please download the app `
			+ `on <a href="${substitutions.ios_beta_app}">iOS</a> or `
			+ `<a href="${substitutions.android_beta_app}">Android</a> to get s`
			+ `tarted. You will receive a separate email containing a user guid`
			+ `e with directions for app installation and launch.<br><br>`
			+ `If you have any questions, please `
			+ `<a href="mailto:${substitutions.contact_email}">reach out</a>.`
			+ `<br><br>`
			+ `Thank you!<br>`
			+ `Team Envest`
		}
	},

	investorWelcome: (substitutions) =>
	{
		return {
			subject: 'Welcome to Envest',
			html: `Hi, ${substitutions.first_name}.<br><br>`
			+ `Your Envest author account is now live. Click `
			+ `<a href="http://${substitutions.host}/admin/">here</a> to manage`
			+ ` your profile, log portfolio activity, and post blogs. On your `
			+ `first visit, you’ll be asked to set a password for your account.`
			+ ` Keep your password in a secure place.<br><br>`
			+ `If you have any questions, please `
			+ `<a href="mailto:claudette@envest.com">reach out</a>.<br><br>`
			+ `Thank you!<br>`
			+ `Team Envest`
		}
	},

	paidSubscriber: (substitutions) =>
	{
		return {
			subject: 'Welcome to Envest',
			html: `<strong>Welcome to Envest</strong><br><br>`
			+ `We’re glad you joined us, ${substitutions.first_name}<br><br>`
			+ `One last important step - if you haven’t already, `
			+ `please download our mobile app `
			+ `on <a href="${substitutions.itunes_link}">iOS</a> or `
			+ `<a href="${substitutions.play_market_link}">Android</a> now, `
			+ `which you can access using the same login information you use `
			+ `for our website. Now you’ve got full access to the inner `
			+ `workings of premiere personal investors.<br>`
			+ `Below is some important information about your subscription `
			+ `plan, which you should keep handy for future reference.`
			+ `<br><br><br>`
			+ `<i>The following acknowledges the terms of your recurring payment `
			+ `for your subscription to our website, `
			+ `<a href="https://${substitutions.host}">www.envest.com</a> and`
			+ ` mobile application (collectively, the “Services”). Further `
			+ `information regarding the Services is found in our `
			+ `<a href="https://${substitutions.host}/terms-of-use">Terms of `
			+ `Use</a> and `
			+ `<a href="https://${substitutions.host}/privacy-policy">Privacy `
			+ `Policy</a>. Please retain a copy of this acknowledgment for `
			+ `future reference, as it explains the terms of the billing and `
			+ `cancellation procedures for our Services.</i><br><br>`
			+ `<i>By subscribing to the Services after your trial period and desi`
			+ `nating a payment method for the Services, you authorize Envest`
			+ ` to charge you a monthly subscription fee at the then current `
			+ `rate. We may adjust the subscription fee for our Services at an`
			+ `y time after providing at least 30 days notice to you by email.`
			+ ` We will automatically charge you the subscription fee each mon`
			+ `th on your renewal date until you cancel your subscription. If `
			+ `you wish to review your renewal date or any other details regar`
			+ `ding your subscription please visit our website www.envest.com`
			+ `, login to your account and click on “My Account.” You may also`
			+ ` edit your payment method for the Services and access other inf`
			+ `ormation regarding your subscription at that link.</i>`
			+ `<br><br>`
			+ `<i>You may cancel the Services at any time, and you will continue `
			+ `to have access to the Services through the end of your monthly `
			+ `billing period. Please note that payments are not refundable `
			+ `and there are no refunds or credits for partially used subscrip`
			+ `tion periods. To cancel, please login to your account on the `
			+ `Website and click on “My Account” and follow the instructions `
			+ `for cancellation. If you do not make monthly payments when due,`
			+ ` your access to the Services will also be terminated, except fo`
			+ `r the informational portion of the Website accessible to the ge`
			+ `neral public.</i>`
			+ `<br><br>`
			+ `<i>Please keep in mind that Envest is designed for educational pu`
			+ `rposes only and does not constitute investment advice. Please `
			+ `see our Terms of Use for more information regarding your use `
			+ `and access to the Services.</i>`
			+ `<br><br>`
			+ `<i>If you have any questions regarding the Services or your subscr`
			+ `iption, including how to cancel your subscription to the Servic`
			+ `es, please contact us at <a href="mailto:contact@envest.com">`
			+ `contact@envest.com</a>.</i>`
			+ `<br><br>`
			+ `Invest on!<br>`
			+ `Team Envest`
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

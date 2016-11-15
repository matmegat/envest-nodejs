
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
	}
}

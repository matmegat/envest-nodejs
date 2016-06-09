
var extend = require('lodash/extend')

var SendGrid = require('sendgrid')


module.exports = function Mailer () {
	var mailer = {}
	var API_key = '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'
	var sendgrid = SendGrid(API_key)

	var defaults =
	{
		from: 'netvest.mailer@gmail.com',
		fromname: 'NetVest'
	}

	mailer.send = function (to_email)
	{
		var email = new sendgrid.Email(extend({}, defaults,
		{
			to: to_email,
			subject: 'Welcome to NetVest',
			text: 'Welcome to NetVest'
		}))

		sendgrid.send(email, (err, response) =>
		{
			if (err)
			{
				console.error(err)
			}
			else {
				console.log('Welcome Email Sent to', to_email)
				console.log(response)
			}
		})
	}

	return mailer
}

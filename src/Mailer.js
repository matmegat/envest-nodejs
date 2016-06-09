
var _ = require('lodash')

var SendGrid = require('sendgrid')


module.exports = function Mailer () {
	var mailer = {}
	var API_key = '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'
	var sendgrid = SendGrid(API_key)

	var defaults =
	{
		subject: 'NetVest Mailer',
		text: 'NetVest Mailer',
		html: 'NetVest Mailer',
		from: 'netvest.mailer@gmail.com',
		fromname: 'NetVest'
	}

	var templates =
	{
		welcome: '5ef32fb6-9c55-416b-ae81-0d2df70aa56e'
	}

	mailer.send = function (to_email, template_type, data)
	{
		var email = new sendgrid.Email(_.extend({}, defaults, { to: to_email }))
		var substitutions = {}

		email.setFilters(
		{
			templates:
			{
				settings:
				{
					enable: 1,
					template_id: templates[template_type],
				}
			}
		})

		_.forEach(data, (value, key) =>
		{
			_.set(substitutions, '%' + key + '%', [ value ])
		})

		email.setSubstitutions(substitutions)

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

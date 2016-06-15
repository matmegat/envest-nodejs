
var _ = require('lodash')

var SendGrid = require('sendgrid')

var Err = require('./Err')
var SendgridError = Err('sendgrid_error', 'Sendgrid error.')

module.exports = function Mailer ()
{
	var mailer = {}
	// eslint-disable-next-line max-len
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

	mailer.send = function (data, template_type)
	{
		var email_data = _.pick(data, ['to', 'subject', 'text', 'html'])
		var email = new sendgrid.Email(_.extend({}, defaults, email_data))

		var substitutions = {}
		var template_id = templates[template_type]

		if (template_id)
		{
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

			_.forEach(_.omit(data, 'text', 'html'), (value, key) =>
			{
				_.set(substitutions, '%' + key + '%', [ value ])
			})

			email.setSubstitutions(substitutions)
		}

		return new Promise((resolve, reject) =>
		{
			sendgrid.send(email, (err, response) =>
			{
				if (err)
				{
					reject(SendgridError(err))
				}
				else
				{
					resolve(response)
				}
			})
		})
	}

	return mailer
}

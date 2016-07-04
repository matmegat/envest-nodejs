
var _ = require('lodash')

var SendGrid = require('sendgrid')

var Err = require('./Err')
var SendgridError = Err('sendgrid_error', 'Sendgrid error.')

module.exports = function Mailer (cfg)
{
	var mailer = {}

	var sendgrid = SendGrid(cfg.key)

	var defaults =
	{
		subject: 'NetVest Mailer',
		// text: 'NetVest Mailer',
		// html: 'NetVest Mailer',
		from: 'netvest.mailer@gmail.com',
		fromname: 'NetVest'
	}

	var templates =
	{
		welcome: '5ef32fb6-9c55-416b-ae81-0d2df70aa56e',
		default: 'ba81d1e0-858b-4b28-a48c-53ed78e3c209'
	}

	mailer.send = function (data, template, substs)
	{
		data = _.extend({}, defaults, data)

		if (template in templates)
		{
			template = templates[template]
		}
		else if (typeof template === 'string')
		{
			/* fallback as text */
			data.text = template
			template  = null
		}
		else
		{
			template = null
		}

		var substs = wrapsub(data.substs || {})

		var email = new sendgrid.Email(data)

		if (template)
		{
			email.setFilters(_.set({}, 'templates.settings',
				{ enable: 1, template_id: template }
			))
		}

		email.setSubstitutions(substs)

		return send(email)
	}

	function wrapsub (substs)
	{
		return _.mapKeys(substs, (v, k) => '%' + k + '%')
	}

	function send (email)
	{
		return new Promise((rs, rj) =>
		{
			sendgrid.send(email, (err, response) =>
			{
				if (err)
				{
					rj(SendgridError(err))
				}
				else
				{
					rs(response)
				}
			})
		})
	}

	return mailer
}

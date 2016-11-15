
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
		subject: 'Netvest Mailer',
		// text: 'Netvest Mailer',
		// html: 'Netvest Mailer',
		from: 'netvest.mailer@gmail.com',
		fromname: 'Netvest'
	}

	/* eslint-disable max-len */
	var default_substs =
	{
		ios_app: [ 'https://rink.hockeyapp.net/apps/dcb637f7a19541a4a00ec7dfbbfc7cca/app_versions/232' ],
		android_app: [ 'https://rink.hockeyapp.net/apps/95edc0834f3e484baad85ddd3148d777/app_versions/193' ],
	}
	/* eslint-enable */

	var templates =
	{
		welcome: '5ef32fb6-9c55-416b-ae81-0d2df70aa56e',
		default: 'ba81d1e0-858b-4b28-a48c-53ed78e3c209',
		user_welcome: '499b73ba-d3c0-47ba-922a-c9ce73aa4104'
	}

	mailer.send = function (template, substs, data)
	{
		data = _.extend({}, defaults, data)
		substs = _.extend({}, default_substs, substs)

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

		substs = wrapsub(substs || {})

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

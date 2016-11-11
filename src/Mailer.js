
var _ = require('lodash')

var SendGrid = require('sendgrid')

var Err = require('./Err')
var SendgridError = Err('sendgrid_error', 'Sendgrid error.')

var mandrill = require('mandrill-api/mandrill')

module.exports = function Mailer (cfg)
{
	var mailer = {}

	var sendgrid = SendGrid(cfg.sendgrid.key)

	var defaults =
	{
		subject: 'Netvest Mailer',
		// text: 'Netvest Mailer',
		// html: 'Netvest Mailer',
		from: 'netvest.mailer@gmail.com',
		fromname: 'Netvest'
	}

	var templates =
	{
		welcome: '5ef32fb6-9c55-416b-ae81-0d2df70aa56e',
		default: 'ba81d1e0-858b-4b28-a48c-53ed78e3c209'
	}

	mailer.send = function (template, substs, data)
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


	/* Migrate to Mandrill */
	var mandrill_client = new mandrill.Mandrill(cfg.mandrill.key)

	var mandrill_templates =
	{
		default: 'Common_Template'
	}

	mailer.send_mandrill = (template, substs, data) =>
	{
		if (template in mandrill_templates)
		{
			template = mandrill_templates[template]
		}
		else
		{
			template = null
		}

		substs = wrapsub_mandrill(substs)

		var message = merge_mandrill_message(data, substs)

		return send_mandrill(template, message)
	}

	function wrapsub_mandrill (substs)
	{
		return _.mapKeys(substs, (v, k) =>
		{
			return { name: k, content: v[0] }
		})
	}

	function send_mandrill (template, message)
	{
		template || (template = mandrill_templates.default)

		return new Promise((rs, rj) =>
		{
			mandrill_client.messages.sendTemplate(
			{
				template_name: template,
				template_content: [],
				message: message,
			},
			(result) =>
			{
				console.log(result)
				rs(result)
			},
			(err) =>
			{
				console.log(err)
				rj(err)
			})
		})
	}

	function merge_mandrill_message (data, substs)
	{
		return {
			html: data.html,
			text: data.text,
			subject: `${data.subject} | Nevest Mailer`,
			from_email: 'mailer@netvest.com',
			from_name: 'Netvest Mailer',
			to: [{ email: data.to, type: 'to' }],
			merge: true,
			merge_language: 'handlebars',
			global_merge_vars: substs
		}
	}

	return mailer
}

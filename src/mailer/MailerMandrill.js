
var _ = require('lodash')
var expect = require('chai').expect
var Mandrill = require('mandrill-api/mandrill')

var Err = require('../Err')
var MandrillError = Err('mandrill_error', 'Mandrill error.')

var templates = require('./EmailTemplates')

var default_message =
{
	subject: 'Netvest Mailer',
	to: [],
	html: '',
	text: '',
	from_email: 'contact@netvest.com',
	from_name: 'Netvest',
	headers: {'Reply-To': 'contact@netvest.com'},
	merge: true,
	merge_language: 'handlebars',
	global_merge_vars: [],
}

module.exports = function Mailer (cfg)
{
	var mailer = {}

	var mandrill_templates =
	{
		default: 'Common_Template'
	}

	var mandrill_client = new Mandrill.Mandrill(cfg.key)

	mailer.substs_defaults = cfg.defaults

	mailer.send = (template, data, substs) =>
	{
		expect(data).to.be.an('object')
		expect(data).property('to').to.be.a('string')
		expect(data).property('html').to.be.a('string')

		if (template in mandrill_templates)
		{
			template = mandrill_templates[template]
		}
		else
		{
			template = mandrill_templates.default
		}

		substs = _.extend({},
			mailer.substs_defaults,
			substs,
			{ email_html: data.html, email_text: data.text }
		)

		var message = _.extend({}, default_message,
		{
			to: [{ email: data.to, type: 'to' }],
			subject: data.subject,
			html: data.html,
			text: data.text,
			global_merge_vars: merge_substs(substs)
		})

		return send(template, message)
	}

	function merge_substs (substs)
	{
		return _.map(substs, (v, k) =>
		{
			return { name: k, content: v }
		})
	}

	function send (template, message)
	{
		return new Promise((rs, rj) =>
		{
			mandrill_client.messages.sendTemplate(
			{
				template_name: template,
				template_content: [],
				message: message,
			},
			(res) => rs(res),
			(err) => rj(MandrillError({ reason: err }))
			)
		})
	}

	mailer.templates = templates

	return mailer
}

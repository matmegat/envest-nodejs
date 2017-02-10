
var extend = require('lodash/extend')

var validate = require('../validate')
var sanitize = require('../../sanitize')

module.exports = function Feedback (app)
{
	var feedback = {}

	var mailer = app.mmail

	var validate_feedback_title = validate.string_field(120)
	var validate_feedback_text = validate.string_field(1200)

	feedback.send = function (feedback_email, data)
	{
		validate.required(data.title, 'title')
		validate_feedback_title(data.title, 'title')

		validate.required(data.text, 'text')
		validate_feedback_text(data.text, 'text')

		validate.email(data.email, 'email')

		var substs = extend({}, mailer.substs_defaults,
		{
			email_title: data.title,
			user_email: data.email,
			feedback_text: sanitize.text(data.text),
		})

		var email_data = extend(
			{ to: feedback_email },
			mailer.templates.feedback(substs)
		)

		return mailer.send('default', email_data, substs)
	}

	return feedback
}

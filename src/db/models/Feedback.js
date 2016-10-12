
var validate = require('../validate')

module.exports = function Feedback (app)
{
	var feedback = {}

	var mailer = app.mail

	var validate_feedback_title = validate.string_field(120)
	var validate_feedback_text = validate.string_field(1200)

	feedback.send = function (feedback_email, data)
	{
		validate.required(data.title, 'title')
		validate_feedback_title(data.title, 'title')

		validate.required(data.text, 'text')
		validate_feedback_text(data.text, 'text')

		validate.email(data.email, 'email')

		var email_title = `Feedback from ${data.email}`
		var substs =
		{
			email_title: [ email_title ],
		}

		return mailer.send('default', substs,
		{
			to: feedback_email,
			subject: email_title,
			html: `Title: ${data.title}.`
			+ `<br/><br/>`
			+ `${data.text}`
		})
	}

	return feedback
}


var sanitizeHTML = require('sanitize-html')

module.exports = function sanitize (string)
{
	return sanitizeHTML(string,
	{
		allowedTags:
		[
			'ol', 'ul', 'li',
			'a',
			'i', 'em',
			'b', 'strong',
			'u', 'p', 'br'
		],
		allowedAttributes:
		{
			a: [ 'href' ]
		},
		selfClosing: [ 'br' ],
		parser:
		{
			lowerCaseTags: true
		}
	})
}

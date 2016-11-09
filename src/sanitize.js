
var sanitizeHTML = require('sanitize-html')

module.exports =
{
	sanitize: (string) => sanitizeHTML(string,
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
	}),

	text: (string) => sanitizeHTML(string,
	{
		allowedTags: [],
		allowedAttributes: []
	})
}

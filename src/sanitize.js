
var sanitizeHTML = require('sanitize-html')

module.exports = function sanitize (string)
{
	return sanitizeHTML(string, {
		allowedTags: ['ul', 'li', 'a', 'p', 'em', 'strong', 'u', 'br'],
		allowedAttributes: {
			a: ['href']
		},
		selfClosing: ['br'],
		parser: {
			lowerCaseTags: true
		}
	})
}

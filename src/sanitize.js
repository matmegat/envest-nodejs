
var sanitizeHTML = require('sanitize-html')

var sanitize = module.exports = {}

sanitize.brief = function sanitize_brief (string)
{
	return sanitizeHTML(string, {
		allowedTags: ['ul', 'li', 'a', 'em', 'strong', 'u' 'br'],
		allowedAttributes: {
			a: ['href']
		},
		selfClosing: ['br'],
		parser: {
			lowerCaseTags: true
		}
	})
}

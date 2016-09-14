
var sanitizeHTML = require('sanitize-html')

var sanitize = module.exports = {}

sanitize.brief = function sanitize_brief (string)
{
	return sanitizeHTML(string, {
		allowedTags: ['p', 'b', 'i', 'em', 'strong', 'br'],
		allowedAttributes: [],
		selfClosing: ['br'],
		parser: {
			lowerCaseTags: true
		}
	})
}

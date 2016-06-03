
var url = require('url')

var Url    = url.Url
var format = url.format

module.exports = function Pic (cfg)
{
	var pic = {}

	pic.resolve = function (hash, hostname)
	{
		var uri = new Url()

		/* i'm not absolutely sure this */
		uri.hostname = hostname
		uri.port = cfg.port
		uri.pathname = '/api/static/pic/' + hash

		return {
			hash: hash,
			resolved_uri: format(uri)
		}
	}

	pic.decorate = function ()
	{
		
	}
	
	function decorateItem (response)
	{
		
	}
	

	return pic
}

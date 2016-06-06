
var url = require('url')

var Url    = url.Url
var format = url.format

var curry = require('lodash/curry')
var get   = require('lodash/get')
var set   = require('lodash/set')

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

	pic.decorate = curry((path, hostname, item) =>
	{
		var hash = get(item, path)

		set(item, path, pic.resolve(hash, hostname))

		return item
	})

	return pic
}

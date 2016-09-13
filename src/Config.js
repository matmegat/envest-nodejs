
var fs = require('fs-sync')
var load = fs.readJSON
var exists = fs.exists

var merge = require('lodash/merge')

module.exports = function Config (root)
{
	var cfg = load(root('config.json'))

	var dev = root('dev.json')
	if (exists(dev))
	{
		console.info('applying dev config')

		cfg = merge({}, cfg, load(dev))
	}

	console.info('config: env = %s', cfg.env)
	console.info('config: dev = %s', cfg.dev)

	return cfg
}


var Config = module.exports = function Config (app)
{
	var root = app.root.partial('cfg')

	var cfg = Config.process(root)

	return cfg
}


var fs = require('fs-sync')
var load = fs.readJSON
var exists = fs.exists

var merge = require('lodash/merge')

Config.process = function (cfg_rootpath)
{
	var cfg = load(cfg_rootpath('config.json'))

	var dev = cfg_rootpath('dev.json')

	if (exists(dev))
	{
		console.info('applying dev config')

		cfg = merge({}, cfg, load(dev))
	}

	console.info('config: env = %s', cfg.env)
	console.info('config: dev = %s', cfg.dev)

	return cfg
}

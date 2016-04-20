
var load = require('fs-sync').readJSON

var Config = module.exports = function Config (app)
{
	var root = app.root.partial('cfg')

	var cfg = Config.process(root)

	return cfg
}

Config.process = function (cfg_rootpath)
{
	var cfg = load(cfg_rootpath('dev.json'))

	if (cfg.dev)
	{
		console.info('running dev config')
	}

	return cfg
}

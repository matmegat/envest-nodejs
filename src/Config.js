
var load = require('fs-sync').readJSON

module.exports = function Config (app)
{
	var cfg = load(app.root('cfg/dev.json'))

	if (cfg.dev)
	{
		console.info('running dev config')
	}

	return cfg
}

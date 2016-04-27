
var cfg_rootpath = require('rootpath')(__dirname, '../cfg')
var Config = require('../src/Config')

module.exports =
{
	dev:
	{
		client: 'pg',
		connection: Config.process(cfg_rootpath).pg,

		/*pool:
		{
			min: 2,
			max: 10
		},*/
		migrations:
		{
			tableName: 'knex_migrations'
		}
	}
}

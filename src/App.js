
var rootpath = require('rootpath')

var Config = require('./Config')
var Log = require('./Log')
var Db = require('./db/Db')
var Http = require('./http/Http')
var Mailer = require('./Mailer')

var Heat = require('./workers/heat')

module.exports = function App ()
{
	var app = {}

	app.root = rootpath(__dirname, '..')
	console.info('package at `%s`', app.root())

	app.cfg  = Config(app.root.partial('cfg'))
	app.log  = Log()
	app.mail = Mailer(app.cfg)
	app.db   = Db(app)
	app.http = Http(app)

	app.ready = Promise.all(
	[
		app.db.ready,
		app.http.ready
	])
	.then(() =>
	{
		console.info('READY')
		app.log('READY')
	})
	.catch(error =>
	{
		console.error('NetVest backend init error:')
		console.error(error)
		process.exit(1)
	})

	app.ready.then(() =>
	{
		app.heat = Heat(app)
	}).then(() =>
	{
		var substs =
		{
			email_title: [ 'Suck' ],
		}
		console.log('SEND')

		return app.mail.send_mandrill('default', substs,
		{
			to: 'vzlydnev@distillery.com',
			subject: 'Suck',
			html: `Hi, .<br><br>`
			+ `It’s go time.<br><br>`
			+ `Login to your <a href="http://www.investor.netvest.com" `
			+ `target="_blank">Investor Panel</a> to start managing `
			+ `your profile and publications. Let us know if you have `
			+ `questions <a href="mailto:">$>dffd</a>.`
		})
		.then(console.log, console.error)
	})

	return app
}

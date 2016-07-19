
var Router = require('express').Router
var toss   = require('../../toss')

var authRequired = require('../../auth-required')

module.exports = (model) =>
{
	var symbols = {}

	symbols.express = Router()
	// symbols.express.use(authRequired)

	symbols.express.get('/:symbol/chart', (rq, rs) =>
	{
		var symbol = rq.params.symbol

		var end_date = new Date
		var resolution = 'Day'
		var periods = 180

		toss(rs, model.mock(symbol))
	})

	return symbols
}

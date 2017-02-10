
var Router = require('express').Router
var toss   = require('../../toss')

var authRequired = require('../../auth-required')

module.exports = (model) =>
{
	var symbols = {}

	symbols.express = Router()
	symbols.express.use(authRequired)

	symbols.express.get('/:symbol/chart', (rq, rs) =>
	{
		var symbol = rq.params.symbol

		toss(rs, model.series(symbol))
	})

	symbols.express.get('/:symbol', (rq, rs) =>
	{
		var symbol = rq.params.symbol

		toss(rs, model.detail(symbol))
	})

	return symbols
}

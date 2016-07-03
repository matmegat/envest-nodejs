
var knexed = require('../../knexed')

var SymbolList = require('./SymbolList')

module.exports = function Watchlist (db, symbols)
{
	var w = {}

	var knex = db.knex

	w.user = SymbolList(knexed(knex, 'watchlist_user'))

	w.investor = SymbolList(knexed(knex, 'watchlist_investor'))

	return w
}

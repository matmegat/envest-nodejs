
var expect = require('chai').expect

var knexed = require('../../knexed')

var SymbolList = require('./SymbolList')

module.exports = function Watchlist (db, symbols)
{
	expect(db, 'Watchlists depends on User').property('user')
	expect(db, 'Watchlists depends on Investor').property('investor')

	var w = {}

	var knex = db.knex

	{
		w.user = SymbolList(knexed(knex, 'watchlist_user'))

		w.user.validateId = db.user.validateId
	}

	{
		w.investor = SymbolList(knexed(knex, 'watchlist_investor'))

		w.investor.validateId = db.investor.validateId
	}

	return w
}

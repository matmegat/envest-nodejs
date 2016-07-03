
var expect = require('chai').expect

var knexed = require('../../knexed')

var SymbolList = require('./SymbolList')

var wrap = require('lodash/wrap')
var pick = require('lodash/pick')

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

		w.investor.add = wrap(w.investor.add, (sup, owner_id, symbol, additional) =>
		{
			expect(additional).an('object')
			expect(additional).property('target_price')

			additional = pick(additional, 'target_price')

			return sup(owner_id, symbol, additional)
		})
	}

	return w
}

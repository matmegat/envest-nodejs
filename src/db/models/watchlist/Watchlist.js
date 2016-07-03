
var expect = require('chai').expect

var knexed = require('../../knexed')

var SymbolList = require('./SymbolList')

var wrap = require('lodash/wrap')
var pick = require('lodash/pick')

var Watchlist = module.exports = function Watchlist (db, symbols)
{
	expect(db, 'Watchlists depends on User').property('user')
	expect(db, 'Watchlists depends on Investor').property('investor')

	var w = {}

	var knex = db.knex

	{
		w.user = SymbolList(knexed(knex, schema.user.table_name))

		w.user.validateId = db.user.ensure
	}

	{
		w.investor = SymbolList(knexed(knex, schema.investor.table_name))

		w.investor.validateId = db.investor.ensure

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

var schema = Watchlist.schema = {}

schema.user = (table) =>
{
	SymbolList.schema.columns(table, 'users', 'users.id')
}

schema.user.table_name = 'watchlists_user'


schema.investor = (table) =>
{
	SymbolList.schema.columns(table, 'investors', 'investors.user_id')

	table.decimal('target_price', 12, 2).notNullable()
}

schema.investor.table_name = 'watchlists_investor'

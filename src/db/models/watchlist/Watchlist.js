
var expect = require('chai').expect

var knexed = require('../../knexed')

var SymbolList = require('./SymbolList')

var wrap = require('lodash/wrap')
var pick = require('lodash/pick')
var get  = require('lodash/get')

var validate = require('../../validate')

var Watchlist = module.exports = function Watchlist (db)
{
	expect(db, 'Watchlists depends on User').property('user')
	expect(db, 'Watchlists depends on Investor').property('investor')
	expect(db, 'Watchlists depends on Symbols').property('symbols')

	var w = {}

	var knex = db.knex

	var symbols = db.symbols

	{
		w.user = SymbolList(knexed(knex, schema.user.table_name), symbols)

		w.user.validateId = db.user.ensure
	}

	{
		w.investor = SymbolList(knexed(knex, schema.investor.table_name), symbols)

		w.investor.validateId = db.investor.all.ensure

		w.investor.add =
		wrap(w.investor.add, (sup, owner_id, symbol, additional) =>
		{
			return new Promise(rs =>
			{
				var target_price = get(additional, 'target_price')
				validate.required(target_price, 'target_price')
				validate.integer.positive(target_price, 'target_price')

				additional = pick(additional, 'target_price')

				rs(sup(owner_id, symbol, additional))
			})
		})

		w.investor.decorate = (r, entry) =>
		{
			r.target_price = Number(entry.target_price)

			return r
		}
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

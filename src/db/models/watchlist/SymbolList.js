
var extend = Object.assign
var noop   = require('lodash/noop')
var ends   = require('lodash/endsWith')
var map    = require('lodash/map')
var first  = require('lodash/head')
var omit   = require('lodash/omit')
var at     = require('lodash/at')

var Symbl = require('../symbols/Symbl')

var Err = require('../../../Err')
var AlreadyThere = Err('symbol_already_there', 'Symbol already in this list')

var SymbolList = module.exports = function SymbolList (table, symbols)
{
	var model = {}

	model.validateId = (/* owner_id */) =>
	{
		throw new Error('not_implemented')
	}

	model.decorate = null

	model.byId = (owner_id) =>
	{
		return byId(owner_id)
		.then(transform)
	}

	model.byId.quotes = (owner_id) =>
	{
		return model.byId(owner_id)
		.then(quotes)
	}

	function byId (owner_id)
	{
		return model.validateId(owner_id)
		.then(() =>
		{
			return table()
			.where('owner_id', owner_id)
		})
	}

	var limit_watchlist = 250

	var LimitWatchlist = Err('limit_watchlist', 'Watchlist limited')

	model.add = (owner_id, symbol, additional) =>
	{
		return byId(owner_id)
		.then((items) =>
		{
			if (items.length >= limit_watchlist)
			{
				throw LimitWatchlist({ limit: limit_watchlist })
			}
		})
		.then(() =>
		{
			return symbols.resolve(symbol)
		})
		.then(symbol =>
		{
			var entry =
			{
				owner_id: owner_id,

				symbol_exchange: symbol.exchange,
				symbol_ticker:   symbol.ticker,
			}

			extend(entry, additional)

			return table().insert(entry)
			.then(() =>
			{
				return transform([ entry ])
			})
			.then(first)
		})
		.catch(error =>
		{
			if (error.constraint && ends(error.constraint, 'owner_symbol_unique'))
			{
				throw AlreadyThere()
			}
			else
			{
				throw error
			}
		})
	}

	function transform (entries)
	{
		var s_pair = [ 'symbol_ticker', 'symbol_exchange' ]
		return entries
		.map(entry =>
		{
			var r = omit(entry, s_pair)
			r.symbol = Symbl(at(entry, s_pair))

			return r
		})
	}

	function quotes (entries)
	{
		return symbols.quotes(map(entries, 'symbol'))
		.then(quotes =>
		{
			return map(quotes, (r, i) =>
			{
				if (! r) /* not_resolved */
				{
					throw ReferenceError('wrong_scenario')
				}

				if (model.decorate)
				{
					r = model.decorate(r, entries[i])
				}

				return r
			})
		})
	}

	model.remove = (owner_id, symbol) =>
	{
		return model.validateId(owner_id)
		.then(() =>
		{
			return symbols.resolve(symbol)
		})
		.then((symbol) =>
		{
			return table()
			.where(
			{
				owner_id: owner_id,
				symbol_exchange: symbol.exchange,
				symbol_ticker: symbol.ticker
			})
			.delete()
		})
		.then(noop)
	}

	return model
}


SymbolList.schema = {}


var Symbols = require('../symbols/Symbols')
var expect  = require('chai').expect

SymbolList.schema.columns = (table, name, owner) =>
{
	expect(owner).a('string')
	expect(owner).contain('.')

	table.increments('id').primary()

	table.integer('owner_id').notNullable()
		.references(owner)
		.onUpdate('cascade')
		.onDelete('cascade')

	Symbols.schema.columns('symbol_', table)

	table.unique(
		[ 'owner_id', 'symbol_exchange', 'symbol_ticker' ]
		, name + '_owner_symbol_unique'
	)
}

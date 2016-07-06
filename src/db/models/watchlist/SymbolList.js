
var extend = Object.assign
var noop   = require('lodash/noop')
var ends   = require('lodash/endsWith')
var map    = require('lodash/map')

var at = require('lodash/fp/at')

var Err = require('../../../Err')
var AlreadyThere = Err('symbol_already_there', 'Symbol already in this list')

var SymbolList = module.exports = function SymbolList (table, symbols)
{
	var model = {}

	model.validateId = (/* owner_id */) =>
	{
		throw new Error('not_implemented')
	}

	model.byId = (owner_id) =>
	{
		return model.validateId(owner_id)
		.then(() =>
		{
			return table()
			.where('owner_id', owner_id)
		})
		.then(entries =>
		{
			return symbols.quotes(
				map(entries, at([ 'symbol_ticker', 'symbol_exchange' ]))
			)
			.then(quotes =>
			{
				return map(quotes, (r, i) =>
				{
					var t = entries[i].target_price
					if (r && t) /* fix for unresolved symbols */
					{
						r.target_price = t
					}

					return r
				})
			})
		})
	}

	model.add = (owner_id, symbol, additional) =>
	{
		return model.validateId(owner_id)
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
		.then(noop)
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
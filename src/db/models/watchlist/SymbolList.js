
// var Symbl = require('../symbols/Symbols/Symbl')

var noop = require('lodash/noop')
var extend = Object.assign

var SymbolList = module.exports = function SymbolList (table, symbols)
{
	var model = {}

	model.validateId = () =>
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
		// catch duplicate
		.then(noop)
	}

	model.remove = (owner_id, symbol) =>
	{
		return model.validateId(owner_id)
		.then(() =>
		{
			return symbols.resolve(symbol)
		})
		.then(symbol =>
		{
			// remove
		})
	}

	return model
}


SymbolList.schema = {}


var Symbols = require('../symbols/Symbols')
var expect  = require('chai').expect

SymbolList.schema.columns = (owner) =>
{
	expect(owner).a('string')
	expect(owner).contain('.')

	table.increments('id').primary()

	table.integer('owner_id')
		.references(owner)
		.onUpdate('cascade')
		.onDelete('cascade')

	Symbols.schema.columns('symbol_', table)
}

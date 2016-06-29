
var Xign = require('./Xign')

var Symbols = module.exports = function Symbols (cfg)
{
	var symbols = {}

	var xign = Xign(cfg.xignite)

	symbols.resolve = (symbol) =>
	{
		// Symbols.schema.validate
	}

	xign.fundamentals('TSLA.BATS')
	.then(rs => console.log(rs), console.error)
	.then(() =>
	{
		return xign.resolve('TSLA.BATS')
	})
	.then(rs => console.log(rs), console.error)

	return symbols
}

Symbols.schema = {}

/*
 * columns('', table)        = { exchange, ticker }
 * columns('symbol_', table) = { symbol_exchange, symbol_ticker } // REF
 */
Symbols.schema.columns = (prefix, table) =>
{
	prefix || (prefix = '')

	table.string(prefix + 'exchange').notNullable()
	table.string(prefix + 'ticker').notNullable()

	return table
}


var Err = require('../../../Err')

var WrongFormat = Err('wrong_symbol_format')

Symbols.schema.validate = (symbol) =>
{
	if (! Array.isArray(symbol))
	{
		throw WrongFormat({ reason: 'must_be_array' })
	}
	if (symbol.length !== 2)
	{
		throw WrongFormat({ reason: 'must_be_pair' })
	}

	symbol.forEach(it =>
	{
		if (typeof it !== 'string')
		{
			throw WrongFormat({ reason: 'element_must_be_string' })
		}
	})
}

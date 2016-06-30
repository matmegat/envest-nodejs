
var Xign = require('./Xign')
var Symbl = require('./Symbl')

var Symbols = module.exports = function Symbols (cfg)
{
	var symbols = {}

	var xign = Xign(cfg.xignite)

	symbols.resolve = (symbol) =>
	{
		return vlp(symbol)
		.then(symbol =>
		{
			var xsymbol = symbol__xign(symbol)

			return xign.resolve(xsymbol)
		})
		.then(resl =>
		{
			var symbol = xign__symbol(resl.xsymbol)
			var data =
			{
				symbol:   symbol,
				ticker:   symbol[0],
				exchange: resl.exchange,
				company:  resl.company
			}

			/* TODO temp assert */
			expect(data.exchange).equal(symbol[1])

			return data
		})
	}

	xign.fundamentals('TSLA.BATS')
	.then(rs => console.log(rs), console.error)
	.then(() =>
	{
		return symbols.resolve([ 'TSLA', 'BATS' ])
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



var vl = Symbols.schema.validate = (symbol) =>
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

	return symbol
}

var vlp = Symbols.schema.validate.promise = (symbol) =>
{
	return new Promise(rs => rs(vl(symbol)))
}

var symbol__xign = Symbols.schema.symbol__xign = (symbol) =>
{
	vl(symbol)

	return symbol[0] + '.' + symbol[1]
}


/* TODO temp assert*/
var expect = require('chai').expect

var xign__symbol = Symbols.schema.xign__symbol = (xsymbol) =>
{
	var symbol = String(xsymbol).split('.')

	expect(symbol).length(2)

	return symbol
}

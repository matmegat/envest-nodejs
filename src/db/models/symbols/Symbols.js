
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
			return xign.resolve(symbol.toXign())
		})
		.then(resl =>
		{
			var symbol = Symbl(resl.xsymbol)

			var data =
			{
				symbol:   symbol.toXign(),
				ticker:   symbol.ticker,
				exchange: symbol.exchange,
				company:  resl.company
			}

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

var vl = Symbols.schema.validate = (symbol) =>
{
	return Symbl(symbol)
}

var vlp = Symbols.schema.validate.promise = (symbol) =>
{
	return new Promise(rs => rs(vl(symbol)))
}

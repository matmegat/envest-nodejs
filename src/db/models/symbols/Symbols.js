
var Xign = require('./Xign')
var Symbl = require('./Symbl')

var Symbols = module.exports = function Symbols (cfg)
{
	var symbols = {}

	var xign = Xign(cfg.xignite)

	symbols.resolve = (symbol) =>
	{
		return Symbl.validate(symbol)
		.then(symbol =>
		{
			return xign.resolve(symbol.toXign())
		})
		.then(resl =>
		{
			var symbol = Symbl(resl.symbol)

			symbol.exchange || (symbol.exchange = resl.exchange)

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

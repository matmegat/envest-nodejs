
var Xign = require('./Xign')

var Symbol = module.exports = function Symbol (cfg)
{
	var xign = Xign(cfg.xignite)

	xign.fundamentals('TSLA.BATS')
	.then(rs => console.log(rs), console.error)
	.then(() =>
	{
		return xign.resolve('TSLA.BATS')
	})
	.then(rs => console.log(rs), console.error)
}

Symbol.schema = {}

/*
 * columns('', table)        = { exchange, ticker }
 * columns('symbol_', table) = { symbol_exchange, symbol_ticker } // REF
 */
Symbol.schema.columns = (prefix, table) =>
{
	prefix || (prefix = '')

	table.string(prefix + 'exchange').notNullable()
	table.string(prefix + 'ticker').notNullable()

	return table
}

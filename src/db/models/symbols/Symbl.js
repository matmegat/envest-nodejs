
var Symbl = module.exports = function Symbl (it)
{
	if (Symbl.is(it))
	{
		return it
	}

	if (typeof it === 'string')
	{
		it = it.split('.')

		return Symbl(it)
	}

	if (Array.isArray(it))
	{
		var L = it.length
		if ((L < 1) || (L > 2))
		{
			throw WrongFormat({ reason: 'must_be_a_pair' })
		}

		var s = inst()

		s.ticker   = it[0]
		s.exchange = it[1] || null

		s.toXign = () =>
		{
			var r = [ s.ticker ]
			if (s.exchange)
			{
				r.push(s.exchange)
			}

			return r.join('.')
		}

		s.toString = s.toXign

		s.toFull = () =>
		{
			return {
				full: s.toXign(),
				ticker: s.ticker,
				exchange: s.exchange,
				company: null
			}
		}

		return s
	}

	if (Object(it) === it)
	{
		if (it.ticker && it.exchange)
		{
			return Symbl([ it.ticker, it.exchange ])
		}
	}

	throw WrongFormat({ reason: 'unknown_format' })
}

Symbl.is = (it) =>
{
	return it instanceof Symbl
}

var inst = () => Object.create(Symbl.prototype)

var Err = require('../../../Err')

var WrongFormat = Err('wrong_symbol_format')

Symbl.validate = (it) =>
{
	return new Promise(rs => rs(Symbl(it)))
}

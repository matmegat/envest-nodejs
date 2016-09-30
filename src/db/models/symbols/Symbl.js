/* eslint-disable complexity */
/* eslint-disable max-statements */

var expect = require('chai').expect

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

		if (! it[0])
		{
			throw WrongFormat({ reason: 'empty_ticker' })
		}

		var s = inst()

		s.ticker   = it[0]
		s.exchange = it[1] || null

		expect(s.ticker).a('string')
		s.ticker = s.ticker.toUpperCase()

		if (s.exchange)
		{
			expect(s.exchange).a('string')
			s.exchange = s.exchange.toUpperCase()
		}

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

		s.toDb = () =>
		{
			return {
				symbol_ticker: s.ticker,
				symbol_exchange: s.exchange
			}
		}

		s.isOther = () =>
		{
			return s.exchange === 'OTHER'
		}

		s.inspect = inspect

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
/* eslint-enable */

function inspect ()
{
	return '{' + this.toXign() + '}'
}


Symbl.is = (it) =>
{
	return it instanceof Symbl
}

var inst = () => Object.create(Symbl.prototype)

var Err = require('../../../Err')

var WrongFormat = Err('wrong_symbol_format', 'Cannot parse input as Symbol')

Symbl.validate = (it) =>
{
	return new Promise(rs => rs(Symbl(it)))
}

Symbl.equals = (L, R) =>
{
	L = Symbl(L)
	R = Symbl(R)

	return (L.ticker   === R.ticker)
	    && (L.exchange === R.exchange)
}

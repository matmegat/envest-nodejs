
var expect = require('chai').expect

var own = require('lodash/forOwn')
var map = require('lodash/mapValues')

var head = require('lodash/head')
var tail = require('lodash/tail')

module.exports = function (db)
{
	expect(db).ok

	expect(db, 'Evaluate depends on User').property('user')
	var user = db.user


	var prefns =
	{
		':user-id': (args) =>
		{
			console.info(1, args)
		}
	}

	var fns =
	{
		':user-id': (args) =>
		{
			console.info(2, args)
		}
	}


	var evaluate = function evaluate (form)
	{
		console.log(form)

		var pretotal = {}

		own(form, (value, key) =>
		{
			if (! isExpr(value))
			{
				return
			}

			var fn   = head(value)

			if (! (fn in prefns))
			{
				return
			}

			var args = tail(value)

			var preres = prefns[fn](args)

			pretotal[fn] || (pretotal[fn] = [])

			pretotal[fn].push(preres)
		})

		console.warn(pretotal)

		console.log(form)

		return form
	}


	function isExpr (it)
	{
		if (! Array.isArray(it))
		{
			return false
		}
		if (! (typeof it[0] === 'string'))
		{
			return false
		}

		return true
	}


	return evaluate
}

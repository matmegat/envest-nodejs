
var expect = require('chai').expect

var own  = require('lodash/forOwn')
var map  = require('lodash/map')
var mapv = require('lodash/mapValues')

var head = require('lodash/head')
var tail = require('lodash/tail')

module.exports = function (db)
{
	expect(db).ok

	expect(db, 'Evaluate depends on User').property('user')
	var user = db.user


	var prefns = {}
	var fns = {}


	var flat = require('lodash/flatten')
	var uniq = require('lodash/uniq')

	prefns[':user-id'] = (args2) =>
	{
		args2 = flat(args2)
		args2 = uniq(args2)

		return user.nameByIds(args2)
	}


	var find = require('lodash/find')

	fns[':user-id'] = (args, total) =>
	{
		return find(total, [ 'id', args[0] ])
	}


	var evaluate = function evaluate (form)
	{
		console.log(form)

		var pretotal = {}
		var preresults = {}

		map(form, (value, key) =>
		{
			if (! isExpr(value))
			{
				return
			}

			var fn = head(value)

			if (! (fn in prefns))
			{
				return
			}

			var args = tail(value)

			pretotal[fn] || (pretotal[fn] = [])

			pretotal[fn].push(args)
		})

		return Promise.all(map(pretotal, (args2, fn) =>
		{
			return new Promise(rs => rs(prefns[fn](args2)))
			.then(rs =>
			{
				preresults[fn] = rs
			})
		}))
		.then(() =>
		{
			form = mapv(form, (value, key) =>
			{
				if (! isExpr(value))
				{
					return value
				}

				var fn = head(value)

				if (! (fn in fns))
				{
					return value
				}

				var args = tail(value)

				var res = fns[fn](args, preresults[fn])

				return res
			})

			console.log(form)

			return form
		})
		.catch(console.error)
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


var expect = require('chai').expect

var each = require('lodash/forEach')
var map  = require('lodash/map')
var mapv = require('lodash/mapValues')

var head = require('lodash/head')
var tail = require('lodash/tail')

module.exports = function (db)
{
	expect(db).ok


	var prefns = {}
	var fns = {}


	var flat = require('lodash/flatten')
	var uniq = require('lodash/uniq')

	prefns[':user-id'] = (args2) =>
	{
		args2 = flat(args2)
		args2 = uniq(args2)

		return db.user.nameByIds(args2)
	}


	var find = require('lodash/find')

	fns[':user-id'] = (args, total) =>
	{
		return find(total, [ 'id', args[0] ]) || null
	}


	var evaluate = function evaluate (forms)
	{
		var pretotal = {}
		var preresults = {}

		each(forms, form =>
		{
			each(form, value =>
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
			return map(forms, form =>
			{
				return mapv(form, value =>
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
			})
		})
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

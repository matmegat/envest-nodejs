

var assign = Object.assign

var knexed = require('../../../../knexed')
var Err = require('../../../../../Err')


module.exports = function Tradeops (db, portfolio)
{
	var knex = db.knex

	var table = knexed(knex, 'tradeops')

	var oneMaybe = db.helpers.oneMaybe

	var tradeops = {}

	// store
	tradeops.store = (tradeop, options) =>
	{
		options = (
		{
			override: false
		},
		options)

		var PK = tradeop.toPK()

		return table().select().where(PK)
		.then(oneMaybe)
		.then(so =>
		{
			if (so)
			{
				if (options.override)
				{
					return table().update().where(PK)
					.set(tradeop.toDb())
				}
				else
				{
					throw DuplicateEntry()
				}
			}
			else
			{
				return table().insert(tradeop.toDb())
				.catch(Err.fromDb('timed_tradeop_unique', DuplicateEntry))
			}
		})
	}

	var DuplicateEntry = Err('tradeop_duplicate',
		'There can be only one trading operation per timestamp for Investor')


	return tradeops
}

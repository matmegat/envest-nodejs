
var knexed = require('../../knexed')

var Err = require('../../../Err')

var expect = require('chai').expect

var validateId = require('../../../id').validate.promise

module.exports = function Featured (db, investor)
{
	var featured = {}

	var knex = db.knex
	var oneMaybe = db.helpers.oneMaybe
	var one = db.helpers.one

	featured.table = knexed(knex, 'featured_investor')

	expect(db, 'Featured depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var NewFeaturedInvestor = Emitter(
	'new_featured_investor',
	{ group: 'admins' })

	var WrongInvestorId = investor.WrongInvestorId

	var InvestorNotFound = investor.NotFound

	featured.set = function (investor_id)
	{
		var data = { investor_id: investor_id }

		return validateId(WrongInvestorId, investor_id)
		.then(() =>
		{
			return featured.table()
			.then(oneMaybe)
		})
		.then(item =>
		{
			if (item)
			{
				return featured.table()
				.update(data)
				.where('investor_id', item.investor_id)
			}
			else
			{
				return featured.table()
				.insert(data)
			}
		})
		.catch(Err.fromDb(
			'featured_investor_investor_id_foreign',
			InvestorNotFound
		))
		.then( () =>
		{
			return NewFeaturedInvestor(data)
		})
	}

	var FeaturedInvestorNotFound = Err(
	'featured_investor_not_found',
	'Featured investor not found')

	featured.get = function ()
	{
		return featured.table()
		.then(Err.emptish(FeaturedInvestorNotFound))
		.then(one)
	}

	return featured
}

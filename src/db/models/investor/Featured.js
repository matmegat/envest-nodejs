
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

	var NewFeaturedInvestor = Emitter('new_featured_investor',
	{
		group: 'admins',
		same_id: 'admin'
	})

	var WrongInvestorId = investor.all.WrongInvestorId

	var InvestorNotFound = investor.all.NotFound

	featured.is = function (investor_id)
	{
		return featured.table()
		.where('investor_id', investor_id)
		.then(oneMaybe)
		.then(Boolean)
	}

	var InvestorIsNotPublic = Err('investor_is_not_public',
		'No public investor cannot be featured.')

	featured.set = knexed.transact(knex, (trx, investor_id) =>
	{
		var data = { investor_id: investor_id }

		return validateId(WrongInvestorId, investor_id)
		.then(() =>
		{
			return investor.table(trx)
			.where('user_id', investor_id)
			.where('is_public', false)
			.then(oneMaybe)
		})
		.then(Err.existent(InvestorIsNotPublic))
		.then(() =>
		{
			return featured.table(trx)
			.then(oneMaybe)
		})
		.then(item =>
		{
			if (item)
			{
				return featured.table(trx)
				.update(data)
				.where('investor_id', item.investor_id)
			}
			else
			{
				return featured.table(trx)
				.insert(data)
			}
		})
		.catch(Err.fromDb(
			'featured_investor_investor_id_foreign',
			InvestorNotFound
		))
		.then(() =>
		{
			NewFeaturedInvestor(
			{
				investor: [ ':user-id', investor_id ]
			})
		})
	})

	var FeaturedInvestorNotFound = Err(
		'featured_investor_not_found',
		'Featured investor not found'
	)

	featured.get = function ()
	{
		return featured.table()
		.then(Err.emptish(FeaturedInvestorNotFound))
		.then(one)
	}

	return featured
}

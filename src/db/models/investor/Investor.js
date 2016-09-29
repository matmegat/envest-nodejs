
var extend = require('lodash/extend')
var wrap = require('lodash/wrap')
var pick = require('lodash/pick')

var generate_code = require('../../../crypto-helpers').generate_code

var knexed = require('../../knexed')

var Err = require('../../../Err')
var AlreadyExists = Err('already_investor', 'This user is investor already')

var expect = require('chai').expect

var Onboarding = require('./Onboarding')

var Meta = require('./Meta')

var Portfolio = require('./Portfolio')
var Featured = require('./Featured')

var validate = require('../../validate')

module.exports = function Investor (db)
{
	var investor = {}

	var knex = db.knex
	var raw = knex.raw
	var oneMaybe = db.helpers.oneMaybe
	var one = db.helpers.one

	investor.table = knexed(knex, 'investors')

	expect(db, 'Investors depends on User').property('user')
	var user = db.user

	expect(db, 'Investors depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var emits =
	{
		NewAdmin:    Emitter('investor_reports', { group: 'admins' }),
		NewInvestor: Emitter('investor_reports')
	}

	investor.onboarding = Onboarding(db, investor)

	investor.all    = Meta(investor, raw, {})
	investor.public = Meta(investor, raw, { is_public: true })

	investor.portfolio = Portfolio(db, investor)
	investor.featured = Featured(db, investor)


	investor.all.fullById = wrap(investor.all.byId, (byId, id, trx) =>
	{
		return byId(id, trx)
		.then(r =>
		{
			/* this info accessible for admin only */
			return Promise.all([
				investor.portfolio.byId(id, { extended: true }),
				investor.portfolio.availableDate(id)
			])
			.then(values =>
			{
				var extend_list =
				[
					'holdings',
					'brokerage'
				]

				r.available_from = values[1].format()

				return extend(r, pick(values[0], extend_list))
			})
		})
	})

	investor.create = knexed.transact(knex, (trx, data) =>
	{
		return new Promise(rs =>
		{
			validate.name(data.first_name, 'first_name')
			validate.name(data.last_name, 'last_name')
			validate.email(data.email)

			return rs()
		})
		.then(() => generate_code())
		.then((password) =>
		{
			var user_data = extend({}, data,
			{
				password: password /* new Investor should reset his password */
			})

			return user.create(trx, user_data)
		})
		.then((user_id) => user.byId(user_id, trx))
		.then((user) =>
		{
			return investor.table(trx)
			.insert(
			{
				user_id: user.id,
				historical_returns: '[]'	// PostgreSQL json representation
			}
			, 'user_id')
			.catch(Err.fromDb('investors_pkey', AlreadyExists))
		})
		.then(oneMaybe)
		.then((investor_id) => investor.all.byId(investor_id, trx))
		.then((investor_entry) =>
		{
			var investor_id = investor_entry.id

			return user.emailConfirm(trx, investor_id, data.email)
			.then(() => user.password.reqReset(trx, data.email))
			.then(() =>
			{
				/* notification: 'investor created'
				 * - to all admins?
				 * - to created investor?
				 * */

				var n1 = emits.NewAdmin(
				{
					investor: [ ':user-id', investor_id ]
				}
				, trx)

				var n2 = emits.NewInvestor(investor_id,
				{
					admin: [ ':user-id', data.admin_id ]
				}
				, trx)

				return Promise.all([ n1, n2 ])
			})
			.then(() => investor_entry)
		})
	})

	var get_pic = require('lodash/fp/get')('profile_pic')

	investor.profilePicById = function (user_id)
	{
		return investor.table()
		.where('user_id', user_id)
		.then(one)
		.then(get_pic)
	}

	investor.updateProfilePic = function (data)
	{
		return investor.table()
		.update({
			profile_pic: data.hash
		})
		.where('user_id', data.user_id)
	}

	investor.setPublic = knexed.transact(knex, (trx, id, value, returning) =>
	{
		return investor.all.ensure(id)
		.then(() =>
		{
			return investor.table(trx)
			.where('user_id', id)
			.update('is_public', value, returning)
		})
		.then(one)
	})

	investor.updateStartDate = knexed.transact(knex, (trx, id, returning) =>
	{
		return investor.all.ensure(id)
		.then(() =>
		{
			return investor.table(trx)
			.where('user_id', id)
			.update('start_date', knex.fn.now(),
			returning)
		})
		.then(one)
	})

	investor.getActionMode = function (whom_id, investor_id)
	{
		return Promise.all([ db.admin.is(whom_id), investor.all.is(whom_id) ])
		.then(so =>
		{
			var is_admin    = so[0]
			var is_investor = so[1]

			if (is_admin)
			{
				return 'mode:admin'
			}
			else if (is_investor)
			{
				if (whom_id === investor_id)
				{
					return 'mode:investor'
				}
			}
			return false
		})
	}

	return investor
}

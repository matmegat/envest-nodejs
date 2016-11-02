
var extend = require('lodash/extend')
var wrap = require('lodash/wrap')
var pick = require('lodash/pick')

var knexed = require('../../knexed')

var Err = require('../../../Err')
var AlreadyExists = Err('already_investor', 'This user is investor already')

var expect = require('chai').expect

var Onboarding = require('./Onboarding')

var Meta = require('./Meta')

var Portfolio = require('./Portfolio')
var Featured = require('./Featured')

module.exports = function Investor (db, mailer, app)
{
	var investor = {}

	var knex = db.knex
	var raw = knex.raw
	var oneMaybe = db.helpers.oneMaybe
	var one = db.helpers.one

	investor.table = knexed(knex, 'investors')

	expect(db, 'Investors depends on User').property('user')
	var user = db.user

	expect(db, 'Investors depends on Auth').property('auth')
	var auth = db.auth

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

				r.available_from = values[1]
				if (r.available_from != null)
				{
					r.available_from = r.available_from.format()
				}

				return extend(r, pick(values[0], extend_list))
			})
		})
	})

	investor.create = knexed.transact(knex, (trx, data) =>
	{
		data.email = data.email.toLowerCase()

		return auth.registerWithPass(trx, data)
		.then(id =>
		{
			return investor.table(trx)
			.insert(
			{
				user_id: id,
				historical_returns: '[]',	// PostgreSQL json representation
				profile_pic: 'default-profile.png',
			}
			, 'user_id')
			.catch(Err.fromDb('investors_pkey', AlreadyExists))
		})
		.then(oneMaybe)
		.then((investor_id) => investor.all.byId(investor_id, trx))
		.then(investor_entry =>
		{
			// fill other investor data
			var fields = (field) =>
			{
				return () =>
				{
					if (! (field in data) || ! data[field])
					{
						return Promise.resolve(`"${field}" skipped`)
					}

					return investor
					.onboarding
					.fields[field]
					.set(trx, investor_entry.id, data[field])
				}
			}

			return fields('brokerage')()
			.then(fields('holdings'))
			.then(fields('profession'))
			.then(fields('focus'))
			.then(fields('education'))
			.then(fields('background'))
			.then(fields('hist_return'))
			.then(fields('annual_return'))
			.then(() => investor_entry)
		})
		.then(investor_entry =>
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
			.then(() => user.byId(data.admin_id))
			.then(admin =>
			{

				var substs =
				{
					email_title: [ 'Welcome' ]
				}

				return mailer.send('default', substs,
				{
					to: data.email,
					subject: 'Welcome',
					html: `Hi, ${data.first_name}.<br><br>`
					+ `It’s go time.<br><br>`
					+ `Login to your <a href="http://www.investor.netvest.com" `
					+ `target="_blank">Investor Panel</a> to start managing `
					+ `your profile and publications. Let us know if you have `
					+ `questions <a href="mailto:${admin.email}">${admin.email}</a>.`
				})
			})
			.then(() =>
			{
				app.heat.lookForInvestor(investor_id)
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

	investor.getActionMode = knexed.transact(knex, (trx, whom_id, investor_id) =>
	{
		return Promise.all(
		[
			db.admin.is(whom_id, trx),
			investor.all.is(whom_id, trx)
		])
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
	})

	return investor
}

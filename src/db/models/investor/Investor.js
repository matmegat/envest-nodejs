
var extend = require('lodash/extend')
var wrap = require('lodash/wrap')

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

	investor.all    = Meta(investor.table, raw, {})
	investor.public = Meta(investor.table, raw, { is_public: true })

	investor.portfolio = Portfolio(db, investor)
	investor.featured = Featured(db, investor)

	investor.all.fullById = wrap(investor.all.byId, (byId, id, trx) =>
	{
		return byId(id, trx)
		.then(r =>
		{
			/* this info accessible for admin only */
			return investor.portfolio.full(id)
			.then(full =>
			{
				return extend(r, full)
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

				emits.NewAdmin(
				{
					investor: [ ':user-id', investor_id ]
				})
				emits.NewInvestor(investor_id,
				{
					admin: [ ':user-id', data.admin_id ]
				})
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


	investor.chart = function (id)
	{
		// TODO chart
		return investor.public.ensure(id)
		.then(() =>
		{
			return investor.portfolio.grid(id)
			.then(grid =>
			{
				return grid.map(entry =>
				{
					return {
						timestamp: entry[0],
						value: entry[1]
					}
				})
			})
			.then(points =>
			{
				return { period: 'y2', points: points }
			})
			.then(y2 =>
			{
				/* eslint-disable */
				return [
					{ period: 'today', "utcOffset":-4, points: [{"timestamp":"2016-08-15T13:30:00Z","value":108.76},{"timestamp":"2016-08-15T13:35:00Z","value":108.78},{"timestamp":"2016-08-15T13:40:00Z","value":108.87},{"timestamp":"2016-08-15T13:45:00Z","value":108.99},{"timestamp":"2016-08-15T13:50:00Z","value":109.075},{"timestamp":"2016-08-15T13:55:00Z","value":108.95},{"timestamp":"2016-08-15T14:00:00Z","value":109.03},{"timestamp":"2016-08-15T14:05:00Z","value":109.05},{"timestamp":"2016-08-15T14:10:00Z","value":109.105},{"timestamp":"2016-08-15T14:15:00Z","value":109.21},{"timestamp":"2016-08-15T14:20:00Z","value":109.321},{"timestamp":"2016-08-15T14:25:00Z","value":109.32},{"timestamp":"2016-08-15T14:30:00Z","value":109.335},{"timestamp":"2016-08-15T14:35:00Z","value":109.31},{"timestamp":"2016-08-15T14:40:00Z","value":109.32},{"timestamp":"2016-08-15T14:45:00Z","value":109.255},{"timestamp":"2016-08-15T14:50:00Z","value":109.25},{"timestamp":"2016-08-15T14:55:00Z","value":109.275},{"timestamp":"2016-08-15T15:00:00Z","value":109.25},{"timestamp":"2016-08-15T15:05:00Z","value":109.233},{"timestamp":"2016-08-15T15:10:00Z","value":109.3},{"timestamp":"2016-08-15T15:15:00Z","value":109.405},{"timestamp":"2016-08-15T15:20:00Z","value":109.46},{"timestamp":"2016-08-15T15:25:00Z","value":109.515},{"timestamp":"2016-08-15T15:30:00Z","value":109.47},{"timestamp":"2016-08-15T15:35:00Z","value":109.468},{"timestamp":"2016-08-15T15:40:00Z","value":109.475},{"timestamp":"2016-08-15T15:45:00Z","value":109.366},{"timestamp":"2016-08-15T15:50:00Z","value":109.33},{"timestamp":"2016-08-15T15:55:00Z","value":109.319},{"timestamp":"2016-08-15T16:00:00Z","value":109.344},{"timestamp":"2016-08-15T16:05:00Z","value":109.359},{"timestamp":"2016-08-15T16:10:00Z","value":109.32},{"timestamp":"2016-08-15T16:15:00Z","value":109.31},{"timestamp":"2016-08-15T16:20:00Z","value":109.37},{"timestamp":"2016-08-15T16:25:00Z","value":109.36},{"timestamp":"2016-08-15T16:30:00Z","value":109.405},{"timestamp":"2016-08-15T16:35:00Z","value":109.38},{"timestamp":"2016-08-15T16:40:00Z","value":109.39},{"timestamp":"2016-08-15T16:45:00Z","value":109.36},{"timestamp":"2016-08-15T16:50:00Z","value":109.33},{"timestamp":"2016-08-15T16:55:00Z","value":109.385},{"timestamp":"2016-08-15T17:00:00Z","value":109.383},{"timestamp":"2016-08-15T17:05:00Z","value":109.311},{"timestamp":"2016-08-15T17:10:00Z","value":109.324},{"timestamp":"2016-08-15T17:15:00Z","value":109.35},{"timestamp":"2016-08-15T17:20:00Z","value":109.312},{"timestamp":"2016-08-15T17:25:00Z","value":109.303},{"timestamp":"2016-08-15T17:30:00Z","value":109.22},{"timestamp":"2016-08-15T17:35:00Z","value":109.28},{"timestamp":"2016-08-15T17:40:00Z","value":109.31},{"timestamp":"2016-08-15T17:45:00Z","value":109.29},{"timestamp":"2016-08-15T17:50:00Z","value":109.27},{"timestamp":"2016-08-15T17:55:00Z","value":109.275},{"timestamp":"2016-08-15T18:00:00Z","value":109.29},{"timestamp":"2016-08-15T18:05:00Z","value":109.305},{"timestamp":"2016-08-15T18:10:00Z","value":109.265},{"timestamp":"2016-08-15T18:15:00Z","value":109.245},{"timestamp":"2016-08-15T18:20:00Z","value":109.275},{"timestamp":"2016-08-15T18:25:00Z","value":109.275},{"timestamp":"2016-08-15T18:30:00Z","value":109.286},{"timestamp":"2016-08-15T18:35:00Z","value":109.315},{"timestamp":"2016-08-15T18:40:00Z","value":109.315},{"timestamp":"2016-08-15T18:45:00Z","value":109.37},{"timestamp":"2016-08-15T18:50:00Z","value":109.405},{"timestamp":"2016-08-15T18:55:00Z","value":109.38},{"timestamp":"2016-08-15T19:00:00Z","value":109.355},{"timestamp":"2016-08-15T19:05:00Z","value":109.355},{"timestamp":"2016-08-15T19:10:00Z","value":109.343},{"timestamp":"2016-08-15T19:15:00Z","value":109.4},{"timestamp":"2016-08-15T19:20:00Z","value":109.345},{"timestamp":"2016-08-15T19:25:00Z","value":109.443},{"timestamp":"2016-08-15T19:30:00Z","value":109.43},{"timestamp":"2016-08-15T19:35:00Z","value":109.455},{"timestamp":"2016-08-15T19:40:00Z","value":109.51},{"timestamp":"2016-08-15T19:45:00Z","value":109.485},{"timestamp":"2016-08-15T19:50:00Z","value":109.509},{"timestamp":"2016-08-15T19:55:00Z","value":109.51},{"timestamp":"2016-08-15T20:00:00Z","value":109.51},{"timestamp":"2016-08-15T20:15:00Z","value":109.48}] },
					y2
				]
				/* eslint-enable */
			})
		})
	}

	return investor
}


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

	investor.table_public = (trx) =>
	{
		return investor.table(trx)
		.where('is_public', true)
	}

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
	investor.featured = Featured(db, investor.all)

	investor.all.fullById = wrap(investor.all.byId, (byId, id, trx) =>
	{
		return byId(id, trx)
		.then(r =>
		{
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
		.then((investor_id) =>
		{
			return investor.portfolio.createBrokerage(trx, investor_id, 100000)
			.then(() =>
			{
				return investor.all.byId(investor_id, trx)
			})
		})
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
		return investor.all.ensure(id)
		//.then(() => investor.portfolio.full(id))
		.then(() =>
		{
			return [
				/* eslint-disable */
				{ period: 'today', "utcOffset":-4, points: [{"timestamp":"2016-08-15T13:30:00Z","value":108.76},{"timestamp":"2016-08-15T13:35:00Z","value":108.78},{"timestamp":"2016-08-15T13:40:00Z","value":108.87},{"timestamp":"2016-08-15T13:45:00Z","value":108.99},{"timestamp":"2016-08-15T13:50:00Z","value":109.075},{"timestamp":"2016-08-15T13:55:00Z","value":108.95},{"timestamp":"2016-08-15T14:00:00Z","value":109.03},{"timestamp":"2016-08-15T14:05:00Z","value":109.05},{"timestamp":"2016-08-15T14:10:00Z","value":109.105},{"timestamp":"2016-08-15T14:15:00Z","value":109.21},{"timestamp":"2016-08-15T14:20:00Z","value":109.321},{"timestamp":"2016-08-15T14:25:00Z","value":109.32},{"timestamp":"2016-08-15T14:30:00Z","value":109.335},{"timestamp":"2016-08-15T14:35:00Z","value":109.31},{"timestamp":"2016-08-15T14:40:00Z","value":109.32},{"timestamp":"2016-08-15T14:45:00Z","value":109.255},{"timestamp":"2016-08-15T14:50:00Z","value":109.25},{"timestamp":"2016-08-15T14:55:00Z","value":109.275},{"timestamp":"2016-08-15T15:00:00Z","value":109.25},{"timestamp":"2016-08-15T15:05:00Z","value":109.233},{"timestamp":"2016-08-15T15:10:00Z","value":109.3},{"timestamp":"2016-08-15T15:15:00Z","value":109.405},{"timestamp":"2016-08-15T15:20:00Z","value":109.46},{"timestamp":"2016-08-15T15:25:00Z","value":109.515},{"timestamp":"2016-08-15T15:30:00Z","value":109.47},{"timestamp":"2016-08-15T15:35:00Z","value":109.468},{"timestamp":"2016-08-15T15:40:00Z","value":109.475},{"timestamp":"2016-08-15T15:45:00Z","value":109.366},{"timestamp":"2016-08-15T15:50:00Z","value":109.33},{"timestamp":"2016-08-15T15:55:00Z","value":109.319},{"timestamp":"2016-08-15T16:00:00Z","value":109.344},{"timestamp":"2016-08-15T16:05:00Z","value":109.359},{"timestamp":"2016-08-15T16:10:00Z","value":109.32},{"timestamp":"2016-08-15T16:15:00Z","value":109.31},{"timestamp":"2016-08-15T16:20:00Z","value":109.37},{"timestamp":"2016-08-15T16:25:00Z","value":109.36},{"timestamp":"2016-08-15T16:30:00Z","value":109.405},{"timestamp":"2016-08-15T16:35:00Z","value":109.38},{"timestamp":"2016-08-15T16:40:00Z","value":109.39},{"timestamp":"2016-08-15T16:45:00Z","value":109.36},{"timestamp":"2016-08-15T16:50:00Z","value":109.33},{"timestamp":"2016-08-15T16:55:00Z","value":109.385},{"timestamp":"2016-08-15T17:00:00Z","value":109.383},{"timestamp":"2016-08-15T17:05:00Z","value":109.311},{"timestamp":"2016-08-15T17:10:00Z","value":109.324},{"timestamp":"2016-08-15T17:15:00Z","value":109.35},{"timestamp":"2016-08-15T17:20:00Z","value":109.312},{"timestamp":"2016-08-15T17:25:00Z","value":109.303},{"timestamp":"2016-08-15T17:30:00Z","value":109.22},{"timestamp":"2016-08-15T17:35:00Z","value":109.28},{"timestamp":"2016-08-15T17:40:00Z","value":109.31},{"timestamp":"2016-08-15T17:45:00Z","value":109.29},{"timestamp":"2016-08-15T17:50:00Z","value":109.27},{"timestamp":"2016-08-15T17:55:00Z","value":109.275},{"timestamp":"2016-08-15T18:00:00Z","value":109.29},{"timestamp":"2016-08-15T18:05:00Z","value":109.305},{"timestamp":"2016-08-15T18:10:00Z","value":109.265},{"timestamp":"2016-08-15T18:15:00Z","value":109.245},{"timestamp":"2016-08-15T18:20:00Z","value":109.275},{"timestamp":"2016-08-15T18:25:00Z","value":109.275},{"timestamp":"2016-08-15T18:30:00Z","value":109.286},{"timestamp":"2016-08-15T18:35:00Z","value":109.315},{"timestamp":"2016-08-15T18:40:00Z","value":109.315},{"timestamp":"2016-08-15T18:45:00Z","value":109.37},{"timestamp":"2016-08-15T18:50:00Z","value":109.405},{"timestamp":"2016-08-15T18:55:00Z","value":109.38},{"timestamp":"2016-08-15T19:00:00Z","value":109.355},{"timestamp":"2016-08-15T19:05:00Z","value":109.355},{"timestamp":"2016-08-15T19:10:00Z","value":109.343},{"timestamp":"2016-08-15T19:15:00Z","value":109.4},{"timestamp":"2016-08-15T19:20:00Z","value":109.345},{"timestamp":"2016-08-15T19:25:00Z","value":109.443},{"timestamp":"2016-08-15T19:30:00Z","value":109.43},{"timestamp":"2016-08-15T19:35:00Z","value":109.455},{"timestamp":"2016-08-15T19:40:00Z","value":109.51},{"timestamp":"2016-08-15T19:45:00Z","value":109.485},{"timestamp":"2016-08-15T19:50:00Z","value":109.509},{"timestamp":"2016-08-15T19:55:00Z","value":109.51},{"timestamp":"2016-08-15T20:00:00Z","value":109.51},{"timestamp":"2016-08-15T20:15:00Z","value":109.48}] },
				{ period: "y2", points: [{"timestamp":"2014-09-02T00:00:00Z","value":269.7},{"timestamp":"2014-09-03T00:00:00Z","value":284.12},{"timestamp":"2014-09-04T00:00:00Z","value":281.19},{"timestamp":"2014-09-05T00:00:00Z","value":286.04},{"timestamp":"2014-09-08T00:00:00Z","value":277.39},{"timestamp":"2014-09-09T00:00:00Z","value":282.11},{"timestamp":"2014-09-10T00:00:00Z","value":278.48},{"timestamp":"2014-09-11T00:00:00Z","value":281.1},{"timestamp":"2014-09-12T00:00:00Z","value":280.31},{"timestamp":"2014-09-15T00:00:00Z","value":279.2},{"timestamp":"2014-09-16T00:00:00Z","value":253.86},{"timestamp":"2014-09-17T00:00:00Z","value":260.74},{"timestamp":"2014-09-18T00:00:00Z","value":261.38},{"timestamp":"2014-09-19T00:00:00Z","value":263.82},{"timestamp":"2014-09-22T00:00:00Z","value":259.32},{"timestamp":"2014-09-23T00:00:00Z","value":250.03},{"timestamp":"2014-09-24T00:00:00Z","value":250.41},{"timestamp":"2014-09-25T00:00:00Z","value":252.14},{"timestamp":"2014-09-26T00:00:00Z","value":246.95},{"timestamp":"2014-09-29T00:00:00Z","value":246.6},{"timestamp":"2014-09-30T00:00:00Z","value":245.26},{"timestamp":"2014-10-01T00:00:00Z","value":242.68},{"timestamp":"2014-10-02T00:00:00Z","value":240.24},{"timestamp":"2014-10-03T00:00:00Z","value":251.42},{"timestamp":"2014-10-06T00:00:00Z","value":255.21},{"timestamp":"2014-10-07T00:00:00Z","value":260.62},{"timestamp":"2014-10-08T00:00:00Z","value":259.57},{"timestamp":"2014-10-09T00:00:00Z","value":259.28},{"timestamp":"2014-10-10T00:00:00Z","value":257.01},{"timestamp":"2014-10-13T00:00:00Z","value":236.91},{"timestamp":"2014-10-14T00:00:00Z","value":224.59},{"timestamp":"2014-10-15T00:00:00Z","value":227.06},{"timestamp":"2014-10-16T00:00:00Z","value":229.7},{"timestamp":"2014-10-17T00:00:00Z","value":226.35},{"timestamp":"2014-10-20T00:00:00Z","value":227.48},{"timestamp":"2014-10-21T00:00:00Z","value":230.47},{"timestamp":"2014-10-22T00:00:00Z","value":235.34},{"timestamp":"2014-10-23T00:00:00Z","value":231.1},{"timestamp":"2014-10-24T00:00:00Z","value":235.29},{"timestamp":"2014-10-27T00:00:00Z","value":235.24},{"timestamp":"2014-10-28T00:00:00Z","value":221.67},{"timestamp":"2014-10-29T00:00:00Z","value":242.77},{"timestamp":"2014-10-30T00:00:00Z","value":238.1},{"timestamp":"2014-10-31T00:00:00Z","value":238.66},{"timestamp":"2014-11-03T00:00:00Z","value":241.7},{"timestamp":"2014-11-04T00:00:00Z","value":242.59},{"timestamp":"2014-11-05T00:00:00Z","value":238.93},{"timestamp":"2014-11-06T00:00:00Z","value":230.97},{"timestamp":"2014-11-07T00:00:00Z","value":241.22},{"timestamp":"2014-11-10T00:00:00Z","value":240.2},{"timestamp":"2014-11-11T00:00:00Z","value":241.93},{"timestamp":"2014-11-12T00:00:00Z","value":251.08},{"timestamp":"2014-11-13T00:00:00Z","value":249.1},{"timestamp":"2014-11-14T00:00:00Z","value":251.7},{"timestamp":"2014-11-17T00:00:00Z","value":258.68},{"timestamp":"2014-11-18T00:00:00Z","value":253.98},{"timestamp":"2014-11-19T00:00:00Z","value":257.7},{"timestamp":"2014-11-20T00:00:00Z","value":247.74},{"timestamp":"2014-11-21T00:00:00Z","value":248.71},{"timestamp":"2014-11-24T00:00:00Z","value":242.78},{"timestamp":"2014-11-25T00:00:00Z","value":246.72},{"timestamp":"2014-11-26T00:00:00Z","value":248.09},{"timestamp":"2014-11-28T00:00:00Z","value":248.44},{"timestamp":"2014-12-01T00:00:00Z","value":244.52},{"timestamp":"2014-12-02T00:00:00Z","value":231.64},{"timestamp":"2014-12-03T00:00:00Z","value":231.43},{"timestamp":"2014-12-04T00:00:00Z","value":229.3},{"timestamp":"2014-12-05T00:00:00Z","value":228.28},{"timestamp":"2014-12-08T00:00:00Z","value":223.71},{"timestamp":"2014-12-09T00:00:00Z","value":214.36},{"timestamp":"2014-12-10T00:00:00Z","value":216.89},{"timestamp":"2014-12-11T00:00:00Z","value":209.84},{"timestamp":"2014-12-12T00:00:00Z","value":208.88},{"timestamp":"2014-12-15T00:00:00Z","value":207},{"timestamp":"2014-12-16T00:00:00Z","value":204.04},{"timestamp":"2014-12-17T00:00:00Z","value":197.81},{"timestamp":"2014-12-18T00:00:00Z","value":205.82},{"timestamp":"2014-12-19T00:00:00Z","value":218.26},{"timestamp":"2014-12-22T00:00:00Z","value":219.29},{"timestamp":"2014-12-23T00:00:00Z","value":222.6},{"timestamp":"2014-12-24T00:00:00Z","value":220.97},{"timestamp":"2014-12-26T00:00:00Z","value":222.26},{"timestamp":"2014-12-29T00:00:00Z","value":227.82},{"timestamp":"2014-12-30T00:00:00Z","value":225.71},{"timestamp":"2014-12-31T00:00:00Z","value":222.23},{"timestamp":"2015-01-02T00:00:00Z","value":222.41},{"timestamp":"2015-01-05T00:00:00Z","value":219.31},{"timestamp":"2015-01-06T00:00:00Z","value":210.09},{"timestamp":"2015-01-07T00:00:00Z","value":211.28},{"timestamp":"2015-01-08T00:00:00Z","value":210.95},{"timestamp":"2015-01-09T00:00:00Z","value":210.615},{"timestamp":"2015-01-12T00:00:00Z","value":206.66},{"timestamp":"2015-01-13T00:00:00Z","value":202.21},{"timestamp":"2015-01-14T00:00:00Z","value":204.25},{"timestamp":"2015-01-15T00:00:00Z","value":192.69},{"timestamp":"2015-01-16T00:00:00Z","value":191.87},{"timestamp":"2015-01-20T00:00:00Z","value":193.07},{"timestamp":"2015-01-21T00:00:00Z","value":191.93},{"timestamp":"2015-01-22T00:00:00Z","value":196.57},{"timestamp":"2015-01-23T00:00:00Z","value":201.62},{"timestamp":"2015-01-26T00:00:00Z","value":201.29},{"timestamp":"2015-01-27T00:00:00Z","value":206.55},{"timestamp":"2015-01-28T00:00:00Z","value":205.98},{"timestamp":"2015-01-29T00:00:00Z","value":199.37},{"timestamp":"2015-01-30T00:00:00Z","value":205.2},{"timestamp":"2015-02-02T00:00:00Z","value":203.6},{"timestamp":"2015-02-03T00:00:00Z","value":210.94},{"timestamp":"2015-02-04T00:00:00Z","value":218.36},{"timestamp":"2015-02-05T00:00:00Z","value":218.55},{"timestamp":"2015-02-06T00:00:00Z","value":220.99},{"timestamp":"2015-02-09T00:00:00Z","value":217.36},{"timestamp":"2015-02-10T00:00:00Z","value":217.48},{"timestamp":"2015-02-11T00:00:00Z","value":216.29},{"timestamp":"2015-02-12T00:00:00Z","value":212.8},{"timestamp":"2015-02-13T00:00:00Z","value":202.88},{"timestamp":"2015-02-17T00:00:00Z","value":203.77},{"timestamp":"2015-02-18T00:00:00Z","value":204.35},{"timestamp":"2015-02-19T00:00:00Z","value":204.46},{"timestamp":"2015-02-20T00:00:00Z","value":211.705},{"timestamp":"2015-02-23T00:00:00Z","value":217.11},{"timestamp":"2015-02-24T00:00:00Z","value":207.335},{"timestamp":"2015-02-25T00:00:00Z","value":204.11},{"timestamp":"2015-02-26T00:00:00Z","value":203.76},{"timestamp":"2015-02-27T00:00:00Z","value":207.19},{"timestamp":"2015-03-02T00:00:00Z","value":203.34},{"timestamp":"2015-03-03T00:00:00Z","value":197.325},{"timestamp":"2015-03-04T00:00:00Z","value":199.56},{"timestamp":"2015-03-05T00:00:00Z","value":202.435},{"timestamp":"2015-03-06T00:00:00Z","value":200.63},{"timestamp":"2015-03-09T00:00:00Z","value":193.88},{"timestamp":"2015-03-10T00:00:00Z","value":190.88},{"timestamp":"2015-03-11T00:00:00Z","value":190.32},{"timestamp":"2015-03-12T00:00:00Z","value":193.74},{"timestamp":"2015-03-13T00:00:00Z","value":191.07},{"timestamp":"2015-03-16T00:00:00Z","value":188.68},{"timestamp":"2015-03-17T00:00:00Z","value":195.7},{"timestamp":"2015-03-18T00:00:00Z","value":194.73},{"timestamp":"2015-03-19T00:00:00Z","value":200.71},{"timestamp":"2015-03-20T00:00:00Z","value":195.65},{"timestamp":"2015-03-23T00:00:00Z","value":198.08},{"timestamp":"2015-03-24T00:00:00Z","value":199.63},{"timestamp":"2015-03-25T00:00:00Z","value":201.72},{"timestamp":"2015-03-26T00:00:00Z","value":194.3},{"timestamp":"2015-03-27T00:00:00Z","value":190.405},{"timestamp":"2015-03-30T00:00:00Z","value":185},{"timestamp":"2015-03-31T00:00:00Z","value":190.57},{"timestamp":"2015-04-01T00:00:00Z","value":188.77},{"timestamp":"2015-04-02T00:00:00Z","value":187.59},{"timestamp":"2015-04-06T00:00:00Z","value":191},{"timestamp":"2015-04-07T00:00:00Z","value":203.1},{"timestamp":"2015-04-08T00:00:00Z","value":203.25},{"timestamp":"2015-04-09T00:00:00Z","value":207.67},{"timestamp":"2015-04-10T00:00:00Z","value":210.09},{"timestamp":"2015-04-13T00:00:00Z","value":210.9},{"timestamp":"2015-04-14T00:00:00Z","value":209.78},{"timestamp":"2015-04-15T00:00:00Z","value":207.46},{"timestamp":"2015-04-16T00:00:00Z","value":207.83},{"timestamp":"2015-04-17T00:00:00Z","value":206.7},{"timestamp":"2015-04-20T00:00:00Z","value":206.79},{"timestamp":"2015-04-21T00:00:00Z","value":205.27},{"timestamp":"2015-04-22T00:00:00Z","value":209.41},{"timestamp":"2015-04-23T00:00:00Z","value":219.44},{"timestamp":"2015-04-24T00:00:00Z","value":218.6},{"timestamp":"2015-04-27T00:00:00Z","value":218.425},{"timestamp":"2015-04-28T00:00:00Z","value":231.55},{"timestamp":"2015-04-29T00:00:00Z","value":230.48},{"timestamp":"2015-04-30T00:00:00Z","value":232.45},{"timestamp":"2015-05-01T00:00:00Z","value":226.05},{"timestamp":"2015-05-04T00:00:00Z","value":226.03},{"timestamp":"2015-05-05T00:00:00Z","value":230.51},{"timestamp":"2015-05-06T00:00:00Z","value":232.95},{"timestamp":"2015-05-07T00:00:00Z","value":230.43},{"timestamp":"2015-05-08T00:00:00Z","value":236.8},{"timestamp":"2015-05-11T00:00:00Z","value":236.61},{"timestamp":"2015-05-12T00:00:00Z","value":239.49},{"timestamp":"2015-05-13T00:00:00Z","value":244.74},{"timestamp":"2015-05-14T00:00:00Z","value":243.18},{"timestamp":"2015-05-15T00:00:00Z","value":244.1},{"timestamp":"2015-05-18T00:00:00Z","value":248.84},{"timestamp":"2015-05-19T00:00:00Z","value":248.75},{"timestamp":"2015-05-20T00:00:00Z","value":247.14},{"timestamp":"2015-05-21T00:00:00Z","value":244.35},{"timestamp":"2015-05-22T00:00:00Z","value":245.62},{"timestamp":"2015-05-26T00:00:00Z","value":247.73},{"timestamp":"2015-05-27T00:00:00Z","value":247.455},{"timestamp":"2015-05-28T00:00:00Z","value":247.43},{"timestamp":"2015-05-29T00:00:00Z","value":251.45},{"timestamp":"2015-06-01T00:00:00Z","value":250.8},{"timestamp":"2015-06-02T00:00:00Z","value":249.45},{"timestamp":"2015-06-03T00:00:00Z","value":248.35},{"timestamp":"2015-06-04T00:00:00Z","value":248.99},{"timestamp":"2015-06-05T00:00:00Z","value":245.92},{"timestamp":"2015-06-08T00:00:00Z","value":249.14},{"timestamp":"2015-06-09T00:00:00Z","value":256.29},{"timestamp":"2015-06-10T00:00:00Z","value":256},{"timestamp":"2015-06-11T00:00:00Z","value":250.7},{"timestamp":"2015-06-12T00:00:00Z","value":251.41},{"timestamp":"2015-06-15T00:00:00Z","value":250.69},{"timestamp":"2015-06-16T00:00:00Z","value":250.38},{"timestamp":"2015-06-17T00:00:00Z","value":253.12},{"timestamp":"2015-06-18T00:00:00Z","value":260.41},{"timestamp":"2015-06-19T00:00:00Z","value":261.89},{"timestamp":"2015-06-22T00:00:00Z","value":262.51},{"timestamp":"2015-06-23T00:00:00Z","value":259.79},{"timestamp":"2015-06-24T00:00:00Z","value":267.67},{"timestamp":"2015-06-25T00:00:00Z","value":265.17},{"timestamp":"2015-06-26T00:00:00Z","value":268.79},{"timestamp":"2015-06-29T00:00:00Z","value":267.09},{"timestamp":"2015-06-30T00:00:00Z","value":262.02},{"timestamp":"2015-07-01T00:00:00Z","value":268.26},{"timestamp":"2015-07-02T00:00:00Z","value":269.15},{"timestamp":"2015-07-06T00:00:00Z","value":280.02},{"timestamp":"2015-07-07T00:00:00Z","value":279.72},{"timestamp":"2015-07-08T00:00:00Z","value":267.88},{"timestamp":"2015-07-09T00:00:00Z","value":254.96},{"timestamp":"2015-07-10T00:00:00Z","value":257.92},{"timestamp":"2015-07-13T00:00:00Z","value":259.15},{"timestamp":"2015-07-14T00:00:00Z","value":262.16},{"timestamp":"2015-07-15T00:00:00Z","value":265.65},{"timestamp":"2015-07-16T00:00:00Z","value":263.14},{"timestamp":"2015-07-17T00:00:00Z","value":266.68},{"timestamp":"2015-07-20T00:00:00Z","value":274.66},{"timestamp":"2015-07-21T00:00:00Z","value":282.26},{"timestamp":"2015-07-22T00:00:00Z","value":266.77},{"timestamp":"2015-07-23T00:00:00Z","value":267.87},{"timestamp":"2015-07-24T00:00:00Z","value":267.2},{"timestamp":"2015-07-27T00:00:00Z","value":265.41},{"timestamp":"2015-07-28T00:00:00Z","value":253.01},{"timestamp":"2015-07-29T00:00:00Z","value":264.82},{"timestamp":"2015-07-30T00:00:00Z","value":263.82},{"timestamp":"2015-07-31T00:00:00Z","value":266.79},{"timestamp":"2015-08-03T00:00:00Z","value":266.15},{"timestamp":"2015-08-04T00:00:00Z","value":259.99},{"timestamp":"2015-08-05T00:00:00Z","value":266.28},{"timestamp":"2015-08-06T00:00:00Z","value":270.13},{"timestamp":"2015-08-07T00:00:00Z","value":246.13},{"timestamp":"2015-08-10T00:00:00Z","value":242.51},{"timestamp":"2015-08-11T00:00:00Z","value":241.14},{"timestamp":"2015-08-12T00:00:00Z","value":237.37},{"timestamp":"2015-08-13T00:00:00Z","value":238.17},{"timestamp":"2015-08-14T00:00:00Z","value":242.51},{"timestamp":"2015-08-17T00:00:00Z","value":243.15},{"timestamp":"2015-08-18T00:00:00Z","value":254.99},{"timestamp":"2015-08-19T00:00:00Z","value":260.72},{"timestamp":"2015-08-20T00:00:00Z","value":255.25},{"timestamp":"2015-08-21T00:00:00Z","value":242.18},{"timestamp":"2015-08-24T00:00:00Z","value":230.77},{"timestamp":"2015-08-25T00:00:00Z","value":218.87},{"timestamp":"2015-08-26T00:00:00Z","value":220.03},{"timestamp":"2015-08-27T00:00:00Z","value":224.84},{"timestamp":"2015-08-28T00:00:00Z","value":242.99},{"timestamp":"2015-08-31T00:00:00Z","value":248.48},{"timestamp":"2015-09-01T00:00:00Z","value":249.06},{"timestamp":"2015-09-02T00:00:00Z","value":238.63},{"timestamp":"2015-09-03T00:00:00Z","value":247.69},{"timestamp":"2015-09-04T00:00:00Z","value":245.57},{"timestamp":"2015-09-08T00:00:00Z","value":241.93},{"timestamp":"2015-09-09T00:00:00Z","value":248.17},{"timestamp":"2015-09-10T00:00:00Z","value":248.91},{"timestamp":"2015-09-11T00:00:00Z","value":248.48},{"timestamp":"2015-09-14T00:00:00Z","value":250.24},{"timestamp":"2015-09-15T00:00:00Z","value":253.19},{"timestamp":"2015-09-16T00:00:00Z","value":253.57},{"timestamp":"2015-09-17T00:00:00Z","value":262.25},{"timestamp":"2015-09-18T00:00:00Z","value":262.07},{"timestamp":"2015-09-21T00:00:00Z","value":260.62},{"timestamp":"2015-09-22T00:00:00Z","value":264.2},{"timestamp":"2015-09-23T00:00:00Z","value":260.94},{"timestamp":"2015-09-24T00:00:00Z","value":261.06},{"timestamp":"2015-09-25T00:00:00Z","value":263.12},{"timestamp":"2015-09-28T00:00:00Z","value":256.91},{"timestamp":"2015-09-29T00:00:00Z","value":248.43},{"timestamp":"2015-09-30T00:00:00Z","value":246.65},{"timestamp":"2015-10-01T00:00:00Z","value":248.4},{"timestamp":"2015-10-02T00:00:00Z","value":239.88},{"timestamp":"2015-10-05T00:00:00Z","value":247.57},{"timestamp":"2015-10-06T00:00:00Z","value":246.15},{"timestamp":"2015-10-07T00:00:00Z","value":241.46},{"timestamp":"2015-10-08T00:00:00Z","value":231.96},{"timestamp":"2015-10-09T00:00:00Z","value":226.72},{"timestamp":"2015-10-12T00:00:00Z","value":220.69},{"timestamp":"2015-10-13T00:00:00Z","value":215.58},{"timestamp":"2015-10-14T00:00:00Z","value":219.25},{"timestamp":"2015-10-15T00:00:00Z","value":216.88},{"timestamp":"2015-10-16T00:00:00Z","value":221.31},{"timestamp":"2015-10-19T00:00:00Z","value":227.01},{"timestamp":"2015-10-20T00:00:00Z","value":228.1},{"timestamp":"2015-10-21T00:00:00Z","value":213.03},{"timestamp":"2015-10-22T00:00:00Z","value":210.09},{"timestamp":"2015-10-23T00:00:00Z","value":211.72},{"timestamp":"2015-10-26T00:00:00Z","value":209.09},{"timestamp":"2015-10-27T00:00:00Z","value":215.26},{"timestamp":"2015-10-28T00:00:00Z","value":210.35},{"timestamp":"2015-10-29T00:00:00Z","value":212.96},{"timestamp":"2015-10-30T00:00:00Z","value":211.63},{"timestamp":"2015-11-02T00:00:00Z","value":206.93},{"timestamp":"2015-11-03T00:00:00Z","value":213.79},{"timestamp":"2015-11-04T00:00:00Z","value":208.35},{"timestamp":"2015-11-05T00:00:00Z","value":231.63},{"timestamp":"2015-11-06T00:00:00Z","value":231.77},{"timestamp":"2015-11-09T00:00:00Z","value":232.36},{"timestamp":"2015-11-10T00:00:00Z","value":225.33},{"timestamp":"2015-11-11T00:00:00Z","value":216.5},{"timestamp":"2015-11-12T00:00:00Z","value":219.08},{"timestamp":"2015-11-13T00:00:00Z","value":212.94},{"timestamp":"2015-11-16T00:00:00Z","value":207.19},{"timestamp":"2015-11-17T00:00:00Z","value":214.31},{"timestamp":"2015-11-18T00:00:00Z","value":214},{"timestamp":"2015-11-19T00:00:00Z","value":221.07},{"timestamp":"2015-11-20T00:00:00Z","value":221.8},{"timestamp":"2015-11-23T00:00:00Z","value":220.01},{"timestamp":"2015-11-24T00:00:00Z","value":217.75},{"timestamp":"2015-11-25T00:00:00Z","value":218.25},{"timestamp":"2015-11-27T00:00:00Z","value":229.64},{"timestamp":"2015-11-30T00:00:00Z","value":231.61},{"timestamp":"2015-12-01T00:00:00Z","value":230.26},{"timestamp":"2015-12-02T00:00:00Z","value":237.19},{"timestamp":"2015-12-03T00:00:00Z","value":231.99},{"timestamp":"2015-12-04T00:00:00Z","value":232.71},{"timestamp":"2015-12-07T00:00:00Z","value":230.38},{"timestamp":"2015-12-08T00:00:00Z","value":231.13},{"timestamp":"2015-12-09T00:00:00Z","value":226.72},{"timestamp":"2015-12-10T00:00:00Z","value":224.52},{"timestamp":"2015-12-11T00:00:00Z","value":227.07},{"timestamp":"2015-12-14T00:00:00Z","value":217.02},{"timestamp":"2015-12-15T00:00:00Z","value":218.58},{"timestamp":"2015-12-16T00:00:00Z","value":221.09},{"timestamp":"2015-12-17T00:00:00Z","value":234.51},{"timestamp":"2015-12-18T00:00:00Z","value":233.39},{"timestamp":"2015-12-21T00:00:00Z","value":230.46},{"timestamp":"2015-12-22T00:00:00Z","value":232.56},{"timestamp":"2015-12-23T00:00:00Z","value":229.95},{"timestamp":"2015-12-24T00:00:00Z","value":229.7},{"timestamp":"2015-12-28T00:00:00Z","value":230.57},{"timestamp":"2015-12-29T00:00:00Z","value":228.95},{"timestamp":"2015-12-30T00:00:00Z","value":237.19},{"timestamp":"2015-12-31T00:00:00Z","value":238.09},{"timestamp":"2016-01-04T00:00:00Z","value":240.01},{"timestamp":"2016-01-05T00:00:00Z","value":223.41},{"timestamp":"2016-01-06T00:00:00Z","value":223.43},{"timestamp":"2016-01-07T00:00:00Z","value":219.04},{"timestamp":"2016-01-08T00:00:00Z","value":215.65},{"timestamp":"2016-01-11T00:00:00Z","value":211},{"timestamp":"2016-01-12T00:00:00Z","value":207.85},{"timestamp":"2016-01-13T00:00:00Z","value":209.97},{"timestamp":"2016-01-14T00:00:00Z","value":200.31},{"timestamp":"2016-01-15T00:00:00Z","value":206.18},{"timestamp":"2016-01-19T00:00:00Z","value":204.99},{"timestamp":"2016-01-20T00:00:00Z","value":204.72},{"timestamp":"2016-01-21T00:00:00Z","value":198.7},{"timestamp":"2016-01-22T00:00:00Z","value":199.97},{"timestamp":"2016-01-25T00:00:00Z","value":202.55},{"timestamp":"2016-01-26T00:00:00Z","value":196.38},{"timestamp":"2016-01-27T00:00:00Z","value":193.56},{"timestamp":"2016-01-28T00:00:00Z","value":188.07},{"timestamp":"2016-01-29T00:00:00Z","value":189.7},{"timestamp":"2016-02-01T00:00:00Z","value":191.2},{"timestamp":"2016-02-02T00:00:00Z","value":196.94},{"timestamp":"2016-02-03T00:00:00Z","value":182.78},{"timestamp":"2016-02-04T00:00:00Z","value":173.48},{"timestamp":"2016-02-05T00:00:00Z","value":175.33},{"timestamp":"2016-02-08T00:00:00Z","value":162.6},{"timestamp":"2016-02-09T00:00:00Z","value":147.99},{"timestamp":"2016-02-10T00:00:00Z","value":148.25},{"timestamp":"2016-02-11T00:00:00Z","value":143.67},{"timestamp":"2016-02-12T00:00:00Z","value":150.47},{"timestamp":"2016-02-16T00:00:00Z","value":151.04},{"timestamp":"2016-02-17T00:00:00Z","value":155.17},{"timestamp":"2016-02-18T00:00:00Z","value":168.68},{"timestamp":"2016-02-19T00:00:00Z","value":166.77},{"timestamp":"2016-02-22T00:00:00Z","value":166.58},{"timestamp":"2016-02-23T00:00:00Z","value":177.74},{"timestamp":"2016-02-24T00:00:00Z","value":177.21},{"timestamp":"2016-02-25T00:00:00Z","value":179},{"timestamp":"2016-02-26T00:00:00Z","value":187.43},{"timestamp":"2016-02-29T00:00:00Z","value":190.34},{"timestamp":"2016-03-01T00:00:00Z","value":191.93},{"timestamp":"2016-03-02T00:00:00Z","value":186.35},{"timestamp":"2016-03-03T00:00:00Z","value":188.34},{"timestamp":"2016-03-04T00:00:00Z","value":195.74},{"timestamp":"2016-03-07T00:00:00Z","value":201.04},{"timestamp":"2016-03-08T00:00:00Z","value":205.29},{"timestamp":"2016-03-09T00:00:00Z","value":202.6},{"timestamp":"2016-03-10T00:00:00Z","value":208.72},{"timestamp":"2016-03-11T00:00:00Z","value":205.18},{"timestamp":"2016-03-14T00:00:00Z","value":207.5},{"timestamp":"2016-03-15T00:00:00Z","value":215.15},{"timestamp":"2016-03-16T00:00:00Z","value":218.34},{"timestamp":"2016-03-17T00:00:00Z","value":221.93},{"timestamp":"2016-03-18T00:00:00Z","value":226.38},{"timestamp":"2016-03-21T00:00:00Z","value":232.74},{"timestamp":"2016-03-22T00:00:00Z","value":238.32},{"timestamp":"2016-03-23T00:00:00Z","value":234.24},{"timestamp":"2016-03-24T00:00:00Z","value":222.58},{"timestamp":"2016-03-28T00:00:00Z","value":227.75},{"timestamp":"2016-03-29T00:00:00Z","value":230.26},{"timestamp":"2016-03-30T00:00:00Z","value":230.13},{"timestamp":"2016-03-31T00:00:00Z","value":226.89},{"timestamp":"2016-04-01T00:00:00Z","value":229.77},{"timestamp":"2016-04-04T00:00:00Z","value":237.59},{"timestamp":"2016-04-05T00:00:00Z","value":246.99},{"timestamp":"2016-04-06T00:00:00Z","value":255.47},{"timestamp":"2016-04-07T00:00:00Z","value":265.42},{"timestamp":"2016-04-08T00:00:00Z","value":257.2},{"timestamp":"2016-04-11T00:00:00Z","value":250.07},{"timestamp":"2016-04-12T00:00:00Z","value":249.92},{"timestamp":"2016-04-13T00:00:00Z","value":247.82},{"timestamp":"2016-04-14T00:00:00Z","value":254.53},{"timestamp":"2016-04-15T00:00:00Z","value":251.86},{"timestamp":"2016-04-18T00:00:00Z","value":254.51},{"timestamp":"2016-04-19T00:00:00Z","value":253.88},{"timestamp":"2016-04-20T00:00:00Z","value":247.37},{"timestamp":"2016-04-21T00:00:00Z","value":249.97},{"timestamp":"2016-04-22T00:00:00Z","value":248.29},{"timestamp":"2016-04-25T00:00:00Z","value":253.75},{"timestamp":"2016-04-26T00:00:00Z","value":251.82},{"timestamp":"2016-04-27T00:00:00Z","value":253.74},{"timestamp":"2016-04-28T00:00:00Z","value":251.47},{"timestamp":"2016-04-29T00:00:00Z","value":247.71},{"timestamp":"2016-05-02T00:00:00Z","value":240.76},{"timestamp":"2016-05-03T00:00:00Z","value":241.8},{"timestamp":"2016-05-04T00:00:00Z","value":232.32},{"timestamp":"2016-05-05T00:00:00Z","value":222.56},{"timestamp":"2016-05-06T00:00:00Z","value":211.53},{"timestamp":"2016-05-09T00:00:00Z","value":214.93},{"timestamp":"2016-05-10T00:00:00Z","value":208.92},{"timestamp":"2016-05-11T00:00:00Z","value":208.69},{"timestamp":"2016-05-12T00:00:00Z","value":208.96},{"timestamp":"2016-05-13T00:00:00Z","value":207.28},{"timestamp":"2016-05-16T00:00:00Z","value":207.61},{"timestamp":"2016-05-17T00:00:00Z","value":208.29},{"timestamp":"2016-05-18T00:00:00Z","value":204.66},{"timestamp":"2016-05-19T00:00:00Z","value":211.17},{"timestamp":"2016-05-20T00:00:00Z","value":215.21},{"timestamp":"2016-05-23T00:00:00Z","value":220.28},{"timestamp":"2016-05-24T00:00:00Z","value":216.22},{"timestamp":"2016-05-25T00:00:00Z","value":217.91},{"timestamp":"2016-05-26T00:00:00Z","value":219.58},{"timestamp":"2016-05-27T00:00:00Z","value":225.12},{"timestamp":"2016-05-31T00:00:00Z","value":223.04},{"timestamp":"2016-06-01T00:00:00Z","value":223.23},{"timestamp":"2016-06-02T00:00:00Z","value":219.56},{"timestamp":"2016-06-03T00:00:00Z","value":218.96},{"timestamp":"2016-06-06T00:00:00Z","value":218.99},{"timestamp":"2016-06-07T00:00:00Z","value":220.68},{"timestamp":"2016-06-08T00:00:00Z","value":232.34},{"timestamp":"2016-06-09T00:00:00Z","value":235.52},{"timestamp":"2016-06-10T00:00:00Z","value":229.36},{"timestamp":"2016-06-13T00:00:00Z","value":218.79},{"timestamp":"2016-06-14T00:00:00Z","value":217.87},{"timestamp":"2016-06-15T00:00:00Z","value":214.96},{"timestamp":"2016-06-16T00:00:00Z","value":217.7},{"timestamp":"2016-06-17T00:00:00Z","value":217.93},{"timestamp":"2016-06-20T00:00:00Z","value":215.47},{"timestamp":"2016-06-21T00:00:00Z","value":219.7},{"timestamp":"2016-06-22T00:00:00Z","value":219.61},{"timestamp":"2016-06-23T00:00:00Z","value":196.66},{"timestamp":"2016-06-24T00:00:00Z","value":196.4},{"timestamp":"2016-06-27T00:00:00Z","value":193.15},{"timestamp":"2016-06-28T00:00:00Z","value":198.55},{"timestamp":"2016-06-29T00:00:00Z","value":201.79},{"timestamp":"2016-06-30T00:00:00Z","value":210.19},{"timestamp":"2016-07-01T00:00:00Z","value":212.28},{"timestamp":"2016-07-05T00:00:00Z","value":216.5},{"timestamp":"2016-07-06T00:00:00Z","value":213.98},{"timestamp":"2016-07-07T00:00:00Z","value":214.44},{"timestamp":"2016-07-08T00:00:00Z","value":215.94},{"timestamp":"2016-07-11T00:00:00Z","value":216.78},{"timestamp":"2016-07-12T00:00:00Z","value":224.78},{"timestamp":"2016-07-13T00:00:00Z","value":224.65},{"timestamp":"2016-07-14T00:00:00Z","value":222.53},{"timestamp":"2016-07-15T00:00:00Z","value":221.53},{"timestamp":"2016-07-18T00:00:00Z","value":220.4},{"timestamp":"2016-07-19T00:00:00Z","value":226.25},{"timestamp":"2016-07-20T00:00:00Z","value":225.26},{"timestamp":"2016-07-21T00:00:00Z","value":228.36},{"timestamp":"2016-07-22T00:00:00Z","value":220.5},{"timestamp":"2016-07-25T00:00:00Z","value":222.27},{"timestamp":"2016-07-26T00:00:00Z","value":230.01},{"timestamp":"2016-07-27T00:00:00Z","value":229.51},{"timestamp":"2016-07-28T00:00:00Z","value":228.49},{"timestamp":"2016-07-29T00:00:00Z","value":230.61},{"timestamp":"2016-08-01T00:00:00Z","value":234.79},{"timestamp":"2016-08-02T00:00:00Z","value":230.01},{"timestamp":"2016-08-03T00:00:00Z","value":227.2},{"timestamp":"2016-08-04T00:00:00Z","value":225.79},{"timestamp":"2016-08-05T00:00:00Z","value":230.61},{"timestamp":"2016-08-08T00:00:00Z","value":230.03},{"timestamp":"2016-08-09T00:00:00Z","value":226.16},{"timestamp":"2016-08-10T00:00:00Z","value":229.08},{"timestamp":"2016-08-11T00:00:00Z","value":225.65},{"timestamp":"2016-08-12T00:00:00Z","value":224.91},{"timestamp":"2016-08-15T00:00:00Z","value":225.61},{"timestamp":"2016-08-16T00:00:00Z","value":225.59},{"timestamp":"2016-08-17T00:00:00Z","value":223.61},{"timestamp":"2016-08-18T00:00:00Z","value":223.24},{"timestamp":"2016-08-19T00:00:00Z","value":223.51},{"timestamp":"2016-08-22T00:00:00Z","value":225},{"timestamp":"2016-08-23T00:00:00Z","value":222.93},{"timestamp":"2016-08-24T00:00:00Z","value":224.84},{"timestamp":"2016-08-25T00:00:00Z","value":222.62},{"timestamp":"2016-08-26T00:00:00Z","value":220.96}]}
			]
			/* eslint-enable */
		})
	}

	return investor
}

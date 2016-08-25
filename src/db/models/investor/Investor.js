
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
				{ period: 'y2',    points: [{"timestamp":"2015-08-17T00:00:00Z","value":115.96},{"timestamp":"2015-08-18T00:00:00Z","value":117.16},{"timestamp":"2015-08-19T00:00:00Z","value":116.5},{"timestamp":"2015-08-20T00:00:00Z","value":115.01},{"timestamp":"2015-08-21T00:00:00Z","value":112.65},{"timestamp":"2015-08-24T00:00:00Z","value":105.76},{"timestamp":"2015-08-25T00:00:00Z","value":103.12},{"timestamp":"2015-08-26T00:00:00Z","value":103.74},{"timestamp":"2015-08-27T00:00:00Z","value":109.69},{"timestamp":"2015-08-28T00:00:00Z","value":112.92},{"timestamp":"2015-08-31T00:00:00Z","value":113.29},{"timestamp":"2015-09-01T00:00:00Z","value":112.76},{"timestamp":"2015-09-02T00:00:00Z","value":107.72},{"timestamp":"2015-09-03T00:00:00Z","value":112.34},{"timestamp":"2015-09-04T00:00:00Z","value":110.37},{"timestamp":"2015-09-08T00:00:00Z","value":109.27},{"timestamp":"2015-09-09T00:00:00Z","value":112.31},{"timestamp":"2015-09-10T00:00:00Z","value":110.15},{"timestamp":"2015-09-11T00:00:00Z","value":112.57},{"timestamp":"2015-09-14T00:00:00Z","value":114.21},{"timestamp":"2015-09-15T00:00:00Z","value":115.31},{"timestamp":"2015-09-16T00:00:00Z","value":116.28},{"timestamp":"2015-09-17T00:00:00Z","value":116.41},{"timestamp":"2015-09-18T00:00:00Z","value":113.92},{"timestamp":"2015-09-21T00:00:00Z","value":113.45},{"timestamp":"2015-09-22T00:00:00Z","value":115.21},{"timestamp":"2015-09-23T00:00:00Z","value":113.4},{"timestamp":"2015-09-24T00:00:00Z","value":114.32},{"timestamp":"2015-09-25T00:00:00Z","value":115},{"timestamp":"2015-09-28T00:00:00Z","value":114.71},{"timestamp":"2015-09-29T00:00:00Z","value":112.44},{"timestamp":"2015-09-30T00:00:00Z","value":109.06},{"timestamp":"2015-10-01T00:00:00Z","value":110.3},{"timestamp":"2015-10-02T00:00:00Z","value":109.58},{"timestamp":"2015-10-05T00:00:00Z","value":110.38},{"timestamp":"2015-10-06T00:00:00Z","value":110.78},{"timestamp":"2015-10-07T00:00:00Z","value":111.31},{"timestamp":"2015-10-08T00:00:00Z","value":110.78},{"timestamp":"2015-10-09T00:00:00Z","value":109.5},{"timestamp":"2015-10-12T00:00:00Z","value":112.12},{"timestamp":"2015-10-13T00:00:00Z","value":111.6},{"timestamp":"2015-10-14T00:00:00Z","value":111.79},{"timestamp":"2015-10-15T00:00:00Z","value":110.21},{"timestamp":"2015-10-16T00:00:00Z","value":111.86},{"timestamp":"2015-10-19T00:00:00Z","value":111.04},{"timestamp":"2015-10-20T00:00:00Z","value":111.73},{"timestamp":"2015-10-21T00:00:00Z","value":113.77},{"timestamp":"2015-10-22T00:00:00Z","value":113.76},{"timestamp":"2015-10-23T00:00:00Z","value":115.5},{"timestamp":"2015-10-26T00:00:00Z","value":119.08},{"timestamp":"2015-10-27T00:00:00Z","value":115.28},{"timestamp":"2015-10-28T00:00:00Z","value":114.55},{"timestamp":"2015-10-29T00:00:00Z","value":119.27},{"timestamp":"2015-10-30T00:00:00Z","value":120.53},{"timestamp":"2015-11-02T00:00:00Z","value":119.5},{"timestamp":"2015-11-03T00:00:00Z","value":121.18},{"timestamp":"2015-11-04T00:00:00Z","value":122.57},{"timestamp":"2015-11-05T00:00:00Z","value":122},{"timestamp":"2015-11-06T00:00:00Z","value":120.92},{"timestamp":"2015-11-09T00:00:00Z","value":121.06},{"timestamp":"2015-11-10T00:00:00Z","value":120.57},{"timestamp":"2015-11-11T00:00:00Z","value":116.77},{"timestamp":"2015-11-12T00:00:00Z","value":116.11},{"timestamp":"2015-11-13T00:00:00Z","value":115.72},{"timestamp":"2015-11-16T00:00:00Z","value":112.34},{"timestamp":"2015-11-17T00:00:00Z","value":114.175},{"timestamp":"2015-11-18T00:00:00Z","value":113.69},{"timestamp":"2015-11-19T00:00:00Z","value":117.29},{"timestamp":"2015-11-20T00:00:00Z","value":118.78},{"timestamp":"2015-11-23T00:00:00Z","value":119.3},{"timestamp":"2015-11-24T00:00:00Z","value":117.75},{"timestamp":"2015-11-25T00:00:00Z","value":118.88},{"timestamp":"2015-11-27T00:00:00Z","value":118.03},{"timestamp":"2015-11-30T00:00:00Z","value":117.81},{"timestamp":"2015-12-01T00:00:00Z","value":118.3},{"timestamp":"2015-12-02T00:00:00Z","value":117.34},{"timestamp":"2015-12-03T00:00:00Z","value":116.28},{"timestamp":"2015-12-04T00:00:00Z","value":115.2},{"timestamp":"2015-12-07T00:00:00Z","value":119.03},{"timestamp":"2015-12-08T00:00:00Z","value":118.28},{"timestamp":"2015-12-09T00:00:00Z","value":118.23},{"timestamp":"2015-12-10T00:00:00Z","value":115.62},{"timestamp":"2015-12-11T00:00:00Z","value":116.17},{"timestamp":"2015-12-14T00:00:00Z","value":113.18},{"timestamp":"2015-12-15T00:00:00Z","value":112.48},{"timestamp":"2015-12-16T00:00:00Z","value":110.49},{"timestamp":"2015-12-17T00:00:00Z","value":111.34},{"timestamp":"2015-12-18T00:00:00Z","value":108.98},{"timestamp":"2015-12-21T00:00:00Z","value":106.03},{"timestamp":"2015-12-22T00:00:00Z","value":107.33},{"timestamp":"2015-12-23T00:00:00Z","value":107.23},{"timestamp":"2015-12-24T00:00:00Z","value":108.61},{"timestamp":"2015-12-28T00:00:00Z","value":108.03},{"timestamp":"2015-12-29T00:00:00Z","value":106.82},{"timestamp":"2015-12-30T00:00:00Z","value":108.74},{"timestamp":"2015-12-31T00:00:00Z","value":107.32},{"timestamp":"2016-01-04T00:00:00Z","value":105.26},{"timestamp":"2016-01-05T00:00:00Z","value":105.35},{"timestamp":"2016-01-06T00:00:00Z","value":102.71},{"timestamp":"2016-01-07T00:00:00Z","value":100.7},{"timestamp":"2016-01-08T00:00:00Z","value":96.45},{"timestamp":"2016-01-11T00:00:00Z","value":96.96},{"timestamp":"2016-01-12T00:00:00Z","value":98.53},{"timestamp":"2016-01-13T00:00:00Z","value":99.96},{"timestamp":"2016-01-14T00:00:00Z","value":97.39},{"timestamp":"2016-01-15T00:00:00Z","value":99.52},{"timestamp":"2016-01-19T00:00:00Z","value":97.13},{"timestamp":"2016-01-20T00:00:00Z","value":96.66},{"timestamp":"2016-01-21T00:00:00Z","value":96.79},{"timestamp":"2016-01-22T00:00:00Z","value":96.3},{"timestamp":"2016-01-25T00:00:00Z","value":101.42},{"timestamp":"2016-01-26T00:00:00Z","value":99.44},{"timestamp":"2016-01-27T00:00:00Z","value":99.99},{"timestamp":"2016-01-28T00:00:00Z","value":93.42},{"timestamp":"2016-01-29T00:00:00Z","value":94.09},{"timestamp":"2016-02-01T00:00:00Z","value":97.34},{"timestamp":"2016-02-02T00:00:00Z","value":96.43},{"timestamp":"2016-02-03T00:00:00Z","value":94.48},{"timestamp":"2016-02-04T00:00:00Z","value":96.35},{"timestamp":"2016-02-05T00:00:00Z","value":96.6},{"timestamp":"2016-02-08T00:00:00Z","value":94.02},{"timestamp":"2016-02-09T00:00:00Z","value":95.01},{"timestamp":"2016-02-10T00:00:00Z","value":94.99},{"timestamp":"2016-02-11T00:00:00Z","value":94.27},{"timestamp":"2016-02-12T00:00:00Z","value":93.7},{"timestamp":"2016-02-16T00:00:00Z","value":93.99},{"timestamp":"2016-02-17T00:00:00Z","value":96.64},{"timestamp":"2016-02-18T00:00:00Z","value":98.12},{"timestamp":"2016-02-19T00:00:00Z","value":96.26},{"timestamp":"2016-02-22T00:00:00Z","value":96.04},{"timestamp":"2016-02-23T00:00:00Z","value":96.88},{"timestamp":"2016-02-24T00:00:00Z","value":94.69},{"timestamp":"2016-02-25T00:00:00Z","value":96.1},{"timestamp":"2016-02-26T00:00:00Z","value":96.76},{"timestamp":"2016-02-29T00:00:00Z","value":96.91},{"timestamp":"2016-03-01T00:00:00Z","value":96.69},{"timestamp":"2016-03-02T00:00:00Z","value":100.53},{"timestamp":"2016-03-03T00:00:00Z","value":100.75},{"timestamp":"2016-03-04T00:00:00Z","value":101.5},{"timestamp":"2016-03-07T00:00:00Z","value":103.01},{"timestamp":"2016-03-08T00:00:00Z","value":101.87},{"timestamp":"2016-03-09T00:00:00Z","value":101.03},{"timestamp":"2016-03-10T00:00:00Z","value":101.12},{"timestamp":"2016-03-11T00:00:00Z","value":101.17},{"timestamp":"2016-03-14T00:00:00Z","value":102.26},{"timestamp":"2016-03-15T00:00:00Z","value":102.52},{"timestamp":"2016-03-16T00:00:00Z","value":104.58},{"timestamp":"2016-03-17T00:00:00Z","value":105.97},{"timestamp":"2016-03-18T00:00:00Z","value":105.8},{"timestamp":"2016-03-21T00:00:00Z","value":105.92},{"timestamp":"2016-03-22T00:00:00Z","value":105.91},{"timestamp":"2016-03-23T00:00:00Z","value":106.72},{"timestamp":"2016-03-24T00:00:00Z","value":106.13},{"timestamp":"2016-03-28T00:00:00Z","value":105.67},{"timestamp":"2016-03-29T00:00:00Z","value":105.19},{"timestamp":"2016-03-30T00:00:00Z","value":107.68},{"timestamp":"2016-03-31T00:00:00Z","value":109.56},{"timestamp":"2016-04-01T00:00:00Z","value":108.99},{"timestamp":"2016-04-04T00:00:00Z","value":109.99},{"timestamp":"2016-04-05T00:00:00Z","value":111.12},{"timestamp":"2016-04-06T00:00:00Z","value":109.81},{"timestamp":"2016-04-07T00:00:00Z","value":110.96},{"timestamp":"2016-04-08T00:00:00Z","value":108.54},{"timestamp":"2016-04-11T00:00:00Z","value":108.66},{"timestamp":"2016-04-12T00:00:00Z","value":109.02},{"timestamp":"2016-04-13T00:00:00Z","value":110.44},{"timestamp":"2016-04-14T00:00:00Z","value":112.04},{"timestamp":"2016-04-15T00:00:00Z","value":112.1},{"timestamp":"2016-04-18T00:00:00Z","value":109.85},{"timestamp":"2016-04-19T00:00:00Z","value":107.48},{"timestamp":"2016-04-20T00:00:00Z","value":106.91},{"timestamp":"2016-04-21T00:00:00Z","value":107.13},{"timestamp":"2016-04-22T00:00:00Z","value":105.97},{"timestamp":"2016-04-25T00:00:00Z","value":105.68},{"timestamp":"2016-04-26T00:00:00Z","value":105.08},{"timestamp":"2016-04-27T00:00:00Z","value":104.35},{"timestamp":"2016-04-28T00:00:00Z","value":97.82},{"timestamp":"2016-04-29T00:00:00Z","value":94.83},{"timestamp":"2016-05-02T00:00:00Z","value":93.74},{"timestamp":"2016-05-03T00:00:00Z","value":93.64},{"timestamp":"2016-05-04T00:00:00Z","value":95.18},{"timestamp":"2016-05-05T00:00:00Z","value":94.19},{"timestamp":"2016-05-06T00:00:00Z","value":93.24},{"timestamp":"2016-05-09T00:00:00Z","value":92.72},{"timestamp":"2016-05-10T00:00:00Z","value":92.79},{"timestamp":"2016-05-11T00:00:00Z","value":93.42},{"timestamp":"2016-05-12T00:00:00Z","value":92.51},{"timestamp":"2016-05-13T00:00:00Z","value":90.34},{"timestamp":"2016-05-16T00:00:00Z","value":90.52},{"timestamp":"2016-05-17T00:00:00Z","value":93.88},{"timestamp":"2016-05-18T00:00:00Z","value":93.49},{"timestamp":"2016-05-19T00:00:00Z","value":94.56},{"timestamp":"2016-05-20T00:00:00Z","value":94.2},{"timestamp":"2016-05-23T00:00:00Z","value":95.22},{"timestamp":"2016-05-24T00:00:00Z","value":96.43},{"timestamp":"2016-05-25T00:00:00Z","value":97.9},{"timestamp":"2016-05-26T00:00:00Z","value":99.62},{"timestamp":"2016-05-27T00:00:00Z","value":100.41},{"timestamp":"2016-05-31T00:00:00Z","value":100.35},{"timestamp":"2016-06-01T00:00:00Z","value":99.86},{"timestamp":"2016-06-02T00:00:00Z","value":98.46},{"timestamp":"2016-06-03T00:00:00Z","value":97.72},{"timestamp":"2016-06-06T00:00:00Z","value":97.92},{"timestamp":"2016-06-07T00:00:00Z","value":98.63},{"timestamp":"2016-06-08T00:00:00Z","value":99.03},{"timestamp":"2016-06-09T00:00:00Z","value":98.94},{"timestamp":"2016-06-10T00:00:00Z","value":99.65},{"timestamp":"2016-06-13T00:00:00Z","value":98.83},{"timestamp":"2016-06-14T00:00:00Z","value":97.34},{"timestamp":"2016-06-15T00:00:00Z","value":97.46},{"timestamp":"2016-06-16T00:00:00Z","value":97.14},{"timestamp":"2016-06-17T00:00:00Z","value":97.55},{"timestamp":"2016-06-20T00:00:00Z","value":95.33},{"timestamp":"2016-06-21T00:00:00Z","value":95.1},{"timestamp":"2016-06-22T00:00:00Z","value":95.91},{"timestamp":"2016-06-23T00:00:00Z","value":95.55},{"timestamp":"2016-06-24T00:00:00Z","value":96.1},{"timestamp":"2016-06-27T00:00:00Z","value":93.4},{"timestamp":"2016-06-28T00:00:00Z","value":92.04},{"timestamp":"2016-06-29T00:00:00Z","value":93.59},{"timestamp":"2016-06-30T00:00:00Z","value":94.4},{"timestamp":"2016-07-01T00:00:00Z","value":95.6},{"timestamp":"2016-07-05T00:00:00Z","value":95.89},{"timestamp":"2016-07-06T00:00:00Z","value":94.99},{"timestamp":"2016-07-07T00:00:00Z","value":95.53},{"timestamp":"2016-07-08T00:00:00Z","value":95.94},{"timestamp":"2016-07-11T00:00:00Z","value":96.68},{"timestamp":"2016-07-12T00:00:00Z","value":96.98},{"timestamp":"2016-07-13T00:00:00Z","value":97.42},{"timestamp":"2016-07-14T00:00:00Z","value":96.87},{"timestamp":"2016-07-15T00:00:00Z","value":98.79},{"timestamp":"2016-07-18T00:00:00Z","value":98.78},{"timestamp":"2016-07-19T00:00:00Z","value":99.83},{"timestamp":"2016-07-20T00:00:00Z","value":99.87},{"timestamp":"2016-07-21T00:00:00Z","value":99.96},{"timestamp":"2016-07-22T00:00:00Z","value":99.43},{"timestamp":"2016-07-25T00:00:00Z","value":98.66},{"timestamp":"2016-07-26T00:00:00Z","value":97.34},{"timestamp":"2016-07-27T00:00:00Z","value":96.67},{"timestamp":"2016-07-28T00:00:00Z","value":102.95},{"timestamp":"2016-07-29T00:00:00Z","value":104.34},{"timestamp":"2016-08-01T00:00:00Z","value":104.21},{"timestamp":"2016-08-02T00:00:00Z","value":106.05},{"timestamp":"2016-08-03T00:00:00Z","value":104.48},{"timestamp":"2016-08-04T00:00:00Z","value":105.79},{"timestamp":"2016-08-05T00:00:00Z","value":105.87},{"timestamp":"2016-08-08T00:00:00Z","value":107.48},{"timestamp":"2016-08-09T00:00:00Z","value":108.37},{"timestamp":"2016-08-10T00:00:00Z","value":108.81},{"timestamp":"2016-08-11T00:00:00Z","value":108},{"timestamp":"2016-08-12T00:00:00Z","value":107.93},{"timestamp":"2016-08-15T00:00:00Z","value":108.18}]},
			]
			/* eslint-enable */
		})
	}

	return investor
}

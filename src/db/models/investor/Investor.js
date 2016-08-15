
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

	investor.all.byId = wrap(investor.all.byId, (byId, id, trx) =>
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
				// eslint-disable-next-line
				{ period: 'ytd',   points: [{"timestamp":"2016-01-04T00:00:00Z","value":240.01},{"timestamp":"2016-01-05T00:00:00Z","value":223.41},{"timestamp":"2016-01-06T00:00:00Z","value":223.43},{"timestamp":"2016-01-07T00:00:00Z","value":219.04},{"timestamp":"2016-01-08T00:00:00Z","value":215.65},{"timestamp":"2016-01-11T00:00:00Z","value":211},{"timestamp":"2016-01-12T00:00:00Z","value":207.85},{"timestamp":"2016-01-13T00:00:00Z","value":209.97},{"timestamp":"2016-01-14T00:00:00Z","value":200.31},{"timestamp":"2016-01-15T00:00:00Z","value":206.18},{"timestamp":"2016-01-19T00:00:00Z","value":204.99},{"timestamp":"2016-01-20T00:00:00Z","value":204.72},{"timestamp":"2016-01-21T00:00:00Z","value":198.7},{"timestamp":"2016-01-22T00:00:00Z","value":199.97},{"timestamp":"2016-01-25T00:00:00Z","value":202.55},{"timestamp":"2016-01-26T00:00:00Z","value":196.38},{"timestamp":"2016-01-27T00:00:00Z","value":193.56},{"timestamp":"2016-01-28T00:00:00Z","value":188.07},{"timestamp":"2016-01-29T00:00:00Z","value":189.7},{"timestamp":"2016-02-01T00:00:00Z","value":191.2},{"timestamp":"2016-02-02T00:00:00Z","value":196.94},{"timestamp":"2016-02-03T00:00:00Z","value":182.78},{"timestamp":"2016-02-04T00:00:00Z","value":173.48},{"timestamp":"2016-02-05T00:00:00Z","value":175.33},{"timestamp":"2016-02-08T00:00:00Z","value":162.6},{"timestamp":"2016-02-09T00:00:00Z","value":147.99},{"timestamp":"2016-02-10T00:00:00Z","value":148.25},{"timestamp":"2016-02-11T00:00:00Z","value":143.67},{"timestamp":"2016-02-12T00:00:00Z","value":150.47},{"timestamp":"2016-02-16T00:00:00Z","value":151.04},{"timestamp":"2016-02-17T00:00:00Z","value":155.17},{"timestamp":"2016-02-18T00:00:00Z","value":168.68},{"timestamp":"2016-02-19T00:00:00Z","value":166.77},{"timestamp":"2016-02-22T00:00:00Z","value":166.58},{"timestamp":"2016-02-23T00:00:00Z","value":177.74},{"timestamp":"2016-02-24T00:00:00Z","value":177.21},{"timestamp":"2016-02-25T00:00:00Z","value":179},{"timestamp":"2016-02-26T00:00:00Z","value":187.43},{"timestamp":"2016-02-29T00:00:00Z","value":190.34},{"timestamp":"2016-03-01T00:00:00Z","value":191.93},{"timestamp":"2016-03-02T00:00:00Z","value":186.35},{"timestamp":"2016-03-03T00:00:00Z","value":188.34},{"timestamp":"2016-03-04T00:00:00Z","value":195.74},{"timestamp":"2016-03-07T00:00:00Z","value":201.04},{"timestamp":"2016-03-08T00:00:00Z","value":205.29},{"timestamp":"2016-03-09T00:00:00Z","value":202.6},{"timestamp":"2016-03-10T00:00:00Z","value":208.72},{"timestamp":"2016-03-11T00:00:00Z","value":205.18},{"timestamp":"2016-03-14T00:00:00Z","value":207.5},{"timestamp":"2016-03-15T00:00:00Z","value":215.15},{"timestamp":"2016-03-16T00:00:00Z","value":218.34},{"timestamp":"2016-03-17T00:00:00Z","value":221.93},{"timestamp":"2016-03-18T00:00:00Z","value":226.38},{"timestamp":"2016-03-21T00:00:00Z","value":232.74},{"timestamp":"2016-03-22T00:00:00Z","value":238.32},{"timestamp":"2016-03-23T00:00:00Z","value":234.24},{"timestamp":"2016-03-24T00:00:00Z","value":222.58},{"timestamp":"2016-03-28T00:00:00Z","value":227.75},{"timestamp":"2016-03-29T00:00:00Z","value":230.26},{"timestamp":"2016-03-30T00:00:00Z","value":230.13},{"timestamp":"2016-03-31T00:00:00Z","value":226.89},{"timestamp":"2016-04-01T00:00:00Z","value":229.77},{"timestamp":"2016-04-04T00:00:00Z","value":237.59},{"timestamp":"2016-04-05T00:00:00Z","value":246.99},{"timestamp":"2016-04-06T00:00:00Z","value":255.47},{"timestamp":"2016-04-07T00:00:00Z","value":265.42},{"timestamp":"2016-04-08T00:00:00Z","value":257.2},{"timestamp":"2016-04-11T00:00:00Z","value":250.07},{"timestamp":"2016-04-12T00:00:00Z","value":249.92},{"timestamp":"2016-04-13T00:00:00Z","value":247.82},{"timestamp":"2016-04-14T00:00:00Z","value":254.53},{"timestamp":"2016-04-15T00:00:00Z","value":251.86},{"timestamp":"2016-04-18T00:00:00Z","value":254.51},{"timestamp":"2016-04-19T00:00:00Z","value":253.88},{"timestamp":"2016-04-20T00:00:00Z","value":247.37},{"timestamp":"2016-04-21T00:00:00Z","value":249.97},{"timestamp":"2016-04-22T00:00:00Z","value":248.29},{"timestamp":"2016-04-25T00:00:00Z","value":253.75},{"timestamp":"2016-04-26T00:00:00Z","value":251.82},{"timestamp":"2016-04-27T00:00:00Z","value":253.74},{"timestamp":"2016-04-28T00:00:00Z","value":251.47},{"timestamp":"2016-04-29T00:00:00Z","value":247.71},{"timestamp":"2016-05-02T00:00:00Z","value":240.76},{"timestamp":"2016-05-03T00:00:00Z","value":241.8},{"timestamp":"2016-05-04T00:00:00Z","value":232.32},{"timestamp":"2016-05-05T00:00:00Z","value":222.56},{"timestamp":"2016-05-06T00:00:00Z","value":211.53},{"timestamp":"2016-05-09T00:00:00Z","value":214.93},{"timestamp":"2016-05-10T00:00:00Z","value":208.92},{"timestamp":"2016-05-11T00:00:00Z","value":208.69},{"timestamp":"2016-05-12T00:00:00Z","value":208.96},{"timestamp":"2016-05-13T00:00:00Z","value":207.28},{"timestamp":"2016-05-16T00:00:00Z","value":207.61},{"timestamp":"2016-05-17T00:00:00Z","value":208.29},{"timestamp":"2016-05-18T00:00:00Z","value":204.66},{"timestamp":"2016-05-19T00:00:00Z","value":211.17},{"timestamp":"2016-05-20T00:00:00Z","value":215.21},{"timestamp":"2016-05-23T00:00:00Z","value":220.28},{"timestamp":"2016-05-24T00:00:00Z","value":216.22},{"timestamp":"2016-05-25T00:00:00Z","value":217.91},{"timestamp":"2016-05-26T00:00:00Z","value":219.58},{"timestamp":"2016-05-27T00:00:00Z","value":225.12},{"timestamp":"2016-05-31T00:00:00Z","value":223.04},{"timestamp":"2016-06-01T00:00:00Z","value":223.23},{"timestamp":"2016-06-02T00:00:00Z","value":219.56},{"timestamp":"2016-06-03T00:00:00Z","value":218.96},{"timestamp":"2016-06-06T00:00:00Z","value":218.99},{"timestamp":"2016-06-07T00:00:00Z","value":220.68},{"timestamp":"2016-06-08T00:00:00Z","value":232.34},{"timestamp":"2016-06-09T00:00:00Z","value":235.52},{"timestamp":"2016-06-10T00:00:00Z","value":229.36},{"timestamp":"2016-06-13T00:00:00Z","value":218.79},{"timestamp":"2016-06-14T00:00:00Z","value":217.87},{"timestamp":"2016-06-15T00:00:00Z","value":214.96},{"timestamp":"2016-06-16T00:00:00Z","value":217.7},{"timestamp":"2016-06-17T00:00:00Z","value":217.93},{"timestamp":"2016-06-20T00:00:00Z","value":215.47},{"timestamp":"2016-06-21T00:00:00Z","value":219.7},{"timestamp":"2016-06-22T00:00:00Z","value":219.61},{"timestamp":"2016-06-23T00:00:00Z","value":196.66},{"timestamp":"2016-06-24T00:00:00Z","value":196.4},{"timestamp":"2016-06-27T00:00:00Z","value":193.15},{"timestamp":"2016-06-28T00:00:00Z","value":198.55},{"timestamp":"2016-06-29T00:00:00Z","value":201.79},{"timestamp":"2016-06-30T00:00:00Z","value":210.19},{"timestamp":"2016-07-01T00:00:00Z","value":212.28},{"timestamp":"2016-07-05T00:00:00Z","value":216.5},{"timestamp":"2016-07-06T00:00:00Z","value":213.98},{"timestamp":"2016-07-07T00:00:00Z","value":214.44},{"timestamp":"2016-07-08T00:00:00Z","value":215.94},{"timestamp":"2016-07-11T00:00:00Z","value":216.78},{"timestamp":"2016-07-12T00:00:00Z","value":224.78},{"timestamp":"2016-07-13T00:00:00Z","value":224.65},{"timestamp":"2016-07-14T00:00:00Z","value":222.53},{"timestamp":"2016-07-15T00:00:00Z","value":221.53},{"timestamp":"2016-07-18T00:00:00Z","value":220.4},{"timestamp":"2016-07-19T00:00:00Z","value":226.25},{"timestamp":"2016-07-20T00:00:00Z","value":225.26},{"timestamp":"2016-07-21T00:00:00Z","value":228.36},{"timestamp":"2016-07-22T00:00:00Z","value":220.5},{"timestamp":"2016-07-25T00:00:00Z","value":222.27},{"timestamp":"2016-07-26T00:00:00Z","value":230.01},{"timestamp":"2016-07-27T00:00:00Z","value":229.51},{"timestamp":"2016-07-28T00:00:00Z","value":228.49},{"timestamp":"2016-07-29T00:00:00Z","value":230.61},{"timestamp":"2016-08-01T00:00:00Z","value":234.79},{"timestamp":"2016-08-02T00:00:00Z","value":230.01},{"timestamp":"2016-08-03T00:00:00Z","value":227.2},{"timestamp":"2016-08-04T00:00:00Z","value":225.79},{"timestamp":"2016-08-05T00:00:00Z","value":230.61},{"timestamp":"2016-08-08T00:00:00Z","value":230.03}]},{"period":"m1","points":[{"timestamp":"2016-07-11T00:00:00Z","value":216.78},{"timestamp":"2016-07-12T00:00:00Z","value":224.78},{"timestamp":"2016-07-13T00:00:00Z","value":224.65},{"timestamp":"2016-07-14T00:00:00Z","value":222.53},{"timestamp":"2016-07-15T00:00:00Z","value":221.53},{"timestamp":"2016-07-18T00:00:00Z","value":220.4},{"timestamp":"2016-07-19T00:00:00Z","value":226.25},{"timestamp":"2016-07-20T00:00:00Z","value":225.26},{"timestamp":"2016-07-21T00:00:00Z","value":228.36},{"timestamp":"2016-07-22T00:00:00Z","value":220.5},{"timestamp":"2016-07-25T00:00:00Z","value":222.27},{"timestamp":"2016-07-26T00:00:00Z","value":230.01},{"timestamp":"2016-07-27T00:00:00Z","value":229.51},{"timestamp":"2016-07-28T00:00:00Z","value":228.49},{"timestamp":"2016-07-29T00:00:00Z","value":230.61},{"timestamp":"2016-08-01T00:00:00Z","value":234.79},{"timestamp":"2016-08-02T00:00:00Z","value":230.01},{"timestamp":"2016-08-03T00:00:00Z","value":227.2},{"timestamp":"2016-08-04T00:00:00Z","value":225.79},{"timestamp":"2016-08-05T00:00:00Z","value":230.61},{"timestamp":"2016-08-08T00:00:00Z","value":230.03}]},{"period":"m6","points":[{"timestamp":"2016-02-09T00:00:00Z","value":147.99},{"timestamp":"2016-02-10T00:00:00Z","value":148.25},{"timestamp":"2016-02-11T00:00:00Z","value":143.67},{"timestamp":"2016-02-12T00:00:00Z","value":150.47},{"timestamp":"2016-02-16T00:00:00Z","value":151.04},{"timestamp":"2016-02-17T00:00:00Z","value":155.17},{"timestamp":"2016-02-18T00:00:00Z","value":168.68},{"timestamp":"2016-02-19T00:00:00Z","value":166.77},{"timestamp":"2016-02-22T00:00:00Z","value":166.58},{"timestamp":"2016-02-23T00:00:00Z","value":177.74},{"timestamp":"2016-02-24T00:00:00Z","value":177.21},{"timestamp":"2016-02-25T00:00:00Z","value":179},{"timestamp":"2016-02-26T00:00:00Z","value":187.43},{"timestamp":"2016-02-29T00:00:00Z","value":190.34},{"timestamp":"2016-03-01T00:00:00Z","value":191.93},{"timestamp":"2016-03-02T00:00:00Z","value":186.35},{"timestamp":"2016-03-03T00:00:00Z","value":188.34},{"timestamp":"2016-03-04T00:00:00Z","value":195.74},{"timestamp":"2016-03-07T00:00:00Z","value":201.04},{"timestamp":"2016-03-08T00:00:00Z","value":205.29},{"timestamp":"2016-03-09T00:00:00Z","value":202.6},{"timestamp":"2016-03-10T00:00:00Z","value":208.72},{"timestamp":"2016-03-11T00:00:00Z","value":205.18},{"timestamp":"2016-03-14T00:00:00Z","value":207.5},{"timestamp":"2016-03-15T00:00:00Z","value":215.15},{"timestamp":"2016-03-16T00:00:00Z","value":218.34},{"timestamp":"2016-03-17T00:00:00Z","value":221.93},{"timestamp":"2016-03-18T00:00:00Z","value":226.38},{"timestamp":"2016-03-21T00:00:00Z","value":232.74},{"timestamp":"2016-03-22T00:00:00Z","value":238.32},{"timestamp":"2016-03-23T00:00:00Z","value":234.24},{"timestamp":"2016-03-24T00:00:00Z","value":222.58},{"timestamp":"2016-03-28T00:00:00Z","value":227.75},{"timestamp":"2016-03-29T00:00:00Z","value":230.26},{"timestamp":"2016-03-30T00:00:00Z","value":230.13},{"timestamp":"2016-03-31T00:00:00Z","value":226.89},{"timestamp":"2016-04-01T00:00:00Z","value":229.77},{"timestamp":"2016-04-04T00:00:00Z","value":237.59},{"timestamp":"2016-04-05T00:00:00Z","value":246.99},{"timestamp":"2016-04-06T00:00:00Z","value":255.47},{"timestamp":"2016-04-07T00:00:00Z","value":265.42},{"timestamp":"2016-04-08T00:00:00Z","value":257.2},{"timestamp":"2016-04-11T00:00:00Z","value":250.07},{"timestamp":"2016-04-12T00:00:00Z","value":249.92},{"timestamp":"2016-04-13T00:00:00Z","value":247.82},{"timestamp":"2016-04-14T00:00:00Z","value":254.53},{"timestamp":"2016-04-15T00:00:00Z","value":251.86},{"timestamp":"2016-04-18T00:00:00Z","value":254.51},{"timestamp":"2016-04-19T00:00:00Z","value":253.88},{"timestamp":"2016-04-20T00:00:00Z","value":247.37},{"timestamp":"2016-04-21T00:00:00Z","value":249.97},{"timestamp":"2016-04-22T00:00:00Z","value":248.29},{"timestamp":"2016-04-25T00:00:00Z","value":253.75},{"timestamp":"2016-04-26T00:00:00Z","value":251.82},{"timestamp":"2016-04-27T00:00:00Z","value":253.74},{"timestamp":"2016-04-28T00:00:00Z","value":251.47},{"timestamp":"2016-04-29T00:00:00Z","value":247.71},{"timestamp":"2016-05-02T00:00:00Z","value":240.76},{"timestamp":"2016-05-03T00:00:00Z","value":241.8},{"timestamp":"2016-05-04T00:00:00Z","value":232.32},{"timestamp":"2016-05-05T00:00:00Z","value":222.56},{"timestamp":"2016-05-06T00:00:00Z","value":211.53},{"timestamp":"2016-05-09T00:00:00Z","value":214.93},{"timestamp":"2016-05-10T00:00:00Z","value":208.92},{"timestamp":"2016-05-11T00:00:00Z","value":208.69},{"timestamp":"2016-05-12T00:00:00Z","value":208.96},{"timestamp":"2016-05-13T00:00:00Z","value":207.28},{"timestamp":"2016-05-16T00:00:00Z","value":207.61},{"timestamp":"2016-05-17T00:00:00Z","value":208.29},{"timestamp":"2016-05-18T00:00:00Z","value":204.66},{"timestamp":"2016-05-19T00:00:00Z","value":211.17},{"timestamp":"2016-05-20T00:00:00Z","value":215.21},{"timestamp":"2016-05-23T00:00:00Z","value":220.28},{"timestamp":"2016-05-24T00:00:00Z","value":216.22},{"timestamp":"2016-05-25T00:00:00Z","value":217.91},{"timestamp":"2016-05-26T00:00:00Z","value":219.58},{"timestamp":"2016-05-27T00:00:00Z","value":225.12},{"timestamp":"2016-05-31T00:00:00Z","value":223.04},{"timestamp":"2016-06-01T00:00:00Z","value":223.23},{"timestamp":"2016-06-02T00:00:00Z","value":219.56},{"timestamp":"2016-06-03T00:00:00Z","value":218.96},{"timestamp":"2016-06-06T00:00:00Z","value":218.99},{"timestamp":"2016-06-07T00:00:00Z","value":220.68},{"timestamp":"2016-06-08T00:00:00Z","value":232.34},{"timestamp":"2016-06-09T00:00:00Z","value":235.52},{"timestamp":"2016-06-10T00:00:00Z","value":229.36},{"timestamp":"2016-06-13T00:00:00Z","value":218.79},{"timestamp":"2016-06-14T00:00:00Z","value":217.87},{"timestamp":"2016-06-15T00:00:00Z","value":214.96},{"timestamp":"2016-06-16T00:00:00Z","value":217.7},{"timestamp":"2016-06-17T00:00:00Z","value":217.93},{"timestamp":"2016-06-20T00:00:00Z","value":215.47},{"timestamp":"2016-06-21T00:00:00Z","value":219.7},{"timestamp":"2016-06-22T00:00:00Z","value":219.61},{"timestamp":"2016-06-23T00:00:00Z","value":196.66},{"timestamp":"2016-06-24T00:00:00Z","value":196.4},{"timestamp":"2016-06-27T00:00:00Z","value":193.15},{"timestamp":"2016-06-28T00:00:00Z","value":198.55},{"timestamp":"2016-06-29T00:00:00Z","value":201.79},{"timestamp":"2016-06-30T00:00:00Z","value":210.19},{"timestamp":"2016-07-01T00:00:00Z","value":212.28},{"timestamp":"2016-07-05T00:00:00Z","value":216.5},{"timestamp":"2016-07-06T00:00:00Z","value":213.98},{"timestamp":"2016-07-07T00:00:00Z","value":214.44},{"timestamp":"2016-07-08T00:00:00Z","value":215.94},{"timestamp":"2016-07-11T00:00:00Z","value":216.78},{"timestamp":"2016-07-12T00:00:00Z","value":224.78},{"timestamp":"2016-07-13T00:00:00Z","value":224.65},{"timestamp":"2016-07-14T00:00:00Z","value":222.53},{"timestamp":"2016-07-15T00:00:00Z","value":221.53},{"timestamp":"2016-07-18T00:00:00Z","value":220.4},{"timestamp":"2016-07-19T00:00:00Z","value":226.25},{"timestamp":"2016-07-20T00:00:00Z","value":225.26},{"timestamp":"2016-07-21T00:00:00Z","value":228.36},{"timestamp":"2016-07-22T00:00:00Z","value":220.5},{"timestamp":"2016-07-25T00:00:00Z","value":222.27},{"timestamp":"2016-07-26T00:00:00Z","value":230.01},{"timestamp":"2016-07-27T00:00:00Z","value":229.51},{"timestamp":"2016-07-28T00:00:00Z","value":228.49},{"timestamp":"2016-07-29T00:00:00Z","value":230.61},{"timestamp":"2016-08-01T00:00:00Z","value":234.79},{"timestamp":"2016-08-02T00:00:00Z","value":230.01},{"timestamp":"2016-08-03T00:00:00Z","value":227.2},{"timestamp":"2016-08-04T00:00:00Z","value":225.79},{"timestamp":"2016-08-05T00:00:00Z","value":230.61},{"timestamp":"2016-08-08T00:00:00Z","value":230.03}] },
				{ period: 'today', points: [] }
			]
		})
	}

	return investor
}
